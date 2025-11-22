import requests
import json
import os
from tqdm import tqdm
import time

# --- 配置 ---
# 后端 API 地址
API_BASE_URL = "http://127.0.0.1:8000/api"
# 本地 Ollama API 地址
OLLAMA_API_URL = "http://127.0.0.1:11434/api/generate"
# 要使用的 Ollama 模型
OLLAMA_MODEL = "qwen:4b"
# 处理后数据的保存目录
PROCESSED_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
# 需要处理的文件列表 (如果为空，则处理所有文件)
# 示例: FILES_TO_PROCESS = ["02水系-总数据和各朝代数据", "18战争-总数据和各朝代数据"]
FILES_TO_PROCESS = []

def get_prompt(context_text, file_context):
    """
    根据文件上下文生成高度优化的特定指令 (Prompt)。
    核心原则：如果找不到信息，必须返回 null，严禁模型编造内容。
    """
    
    # 通用指令头部，强调了准确性和“null”规则
    prompt_header = f"""
你是一个极其严谨的中国历史数据分析师。你的任务是基于下面提供的 **完整上下文数据**，严格按照指定的JSON格式提取信息。
**核心规则：**
1.  **优先使用 '时期' 或 '朝代' 字段** 来确定 `dynasty`。
2.  如果上下文中没有明确提供某个字段的信息，该字段的值必须为 `null`。
3.  **绝对不允许** 猜测或编造任何在上下文中不存在的信息。

文件上下文: {file_context}
"""

    # --- 针对不同文件类型的特定指令 ---
    # 注意：这里的 {text} 占位符将被替换为完整的上下文数据包

    if "战争" in file_context:
        specific_instructions = """
请提取以下字段：
- "event_name": 战争或军事冲突的明确名称。如果文本只描述了状况而无具体名称，则为 null。
- "dynasty": 所属朝代。
- "start_year": 开始年份 (仅数字，公元纪年)。
- "end_year": 结束年份 (仅数字，如果单一年份则与开始年份相同)。
- "participants": 主要参与方 (数组)。
- "location": 主要发生地点。
- "summary": 对事件的简要、客观概述。
- "outcome": 战争或事件的明确结果。
"""
    elif "水系" in file_context:
        specific_instructions = """
请提取以下字段：
- "river_name": 河流或水系的专有名称。
- "dynasty": 所属朝代。
- "change_type": 变化类型 (例如: "改道", "开凿", "淤塞", "功能变更")。
- "location": 涉及的具体地理位置。
- "description": 对变化的客观描述。
- "impact": 变化带来的直接影响。
"""
    elif "建制沿革" in file_context:
        specific_instructions = """
请提取以下字段：
- "institution_name": 机构或制度的专有名称 (例如: "中都警巡院")。
- "dynasty": 所属朝代。
- "year": 设立或变更的年份 (仅数字)。
- "location": 所属行政区划或地点。
- "function": 机构的职能或制度的核心内容。
- "change_description": 对设立、变更或废除的客观描述。
"""
    elif "灾害" in file_context:
        specific_instructions = """
请提取以下字段：
- "disaster_type": 灾害类型 (例如: "洪水", "地震", "旱灾", "蝗灾")。
- "dynasty": 所属朝代。
- "year": 发生年份 (仅数字)。
- "location": 发生地点。
- "description": 对灾害情况的客观描述。
- "impact": 灾害造成的影响，如伤亡、经济损失等。
"""
    elif "人口" in file_context:
        specific_instructions = """
请提取以下字段：
- "subject": 描述的主体 (例如: "总人口", "特定区域人口", "流民")。
- "dynasty": 所属朝代。
- "year": 数据对应的年份 (仅数字)。
- "population_number": 人口数量 (仅数字，如果文本中是“户”，请估算或注明)。
- "change_description": 对人口变化的描述 (例如: "增长", "减少", "迁徙")。
- "source_text": 引用来源的简要说明。
"""
    else:
        # 通用提取指令，同样强调 null 规则
        specific_instructions = """
请提取以下通用字段：
- "subject": 文本描述的核心主题或对象。
- "dynasty": 所属朝代。
- "year": 事件年份 (仅数字)。
- "location": 地点。
- "category": 类别 (例如: "政治", "经济", "文化", "建筑")。
- "summary": 对文本内容的客观摘要。
"""

    # 组合最终的 prompt
    final_prompt = (
        prompt_header + 
        specific_instructions +
        "\n请根据以下 **完整上下文数据** 进行分析和提取:\n---\n" +
        context_text +
        "\n---\n\nJSON输出:"
    )
    return final_prompt


def process_row_with_llm(record, file_context):
    """使用本地 LLM 处理一整行数据记录"""
    if not isinstance(record, dict):
        return None

    # 1. 构建完整的上下文文本
    context_lines = []
    for key, value in record.items():
        # 忽略空的、非字符串或无意义的列
        if value and isinstance(value, str) and value.strip() and "Unnamed" not in key:
            context_lines.append(f"{key.strip()}: {value.strip()}")
    
    if not context_lines:
        return None # 如果没有可处理的文本，则跳过

    context_text = "\n".join(context_lines)

    # 2. 生成 prompt
    prompt = get_prompt(context_text, file_context)
    
    # 3. 调用 LLM API
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.0,
            "top_p": 0.9
        }
    }
    
    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=180) # 增加超时
        response.raise_for_status()
        
        response_data = response.json()
        generated_text = response_data.get("response", "").strip()
        
        # 清理和解析 JSON
        if generated_text.startswith("```json"):
            generated_text = generated_text[7:]
        if generated_text.endswith("```"):
            generated_text = generated_text[:-3]
        
        return json.loads(generated_text)

    except requests.exceptions.RequestException as e:
        print(f"\n[错误] 请求 Ollama API 失败: {e}")
        return None
    except json.JSONDecodeError:
        print(f"\n[警告] LLM 未返回有效的 JSON，原始输出: {generated_text}")
        return {"original_text": context_text, "error": "LLM output is not valid JSON"}
    except Exception as e:
        print(f"\n[错误] 处理行数据时发生未知错误: {e}")
        return None


def main():
    """主函数，执行数据处理流程"""
    print("--- 开始使用 LLM 进行数据预处理 (V3 - 完整上下文) ---")

    # 确保目标目录存在
    if not os.path.exists(PROCESSED_DATA_DIR):
        os.makedirs(PROCESSED_DATA_DIR)
        print(f"已创建目录: {PROCESSED_DATA_DIR}")

    # 获取要处理的文件列表
    try:
        if not FILES_TO_PROCESS:
            print("正在从后端获取文件列表...")
            response = requests.get(f"{API_BASE_URL}/files")
            response.raise_for_status()
            files_to_process = response.json().get("files", [])
        else:
            files_to_process = FILES_TO_PROCESS
        
        if not files_to_process:
            print("[错误] 未找到可处理的文件。请确保后端服务正在运行且数据目录不为空。")
            return

    except requests.exceptions.RequestException as e:
        print(f"[错误] 无法连接到后端服务 ({API_BASE_URL})。请确保服务正在运行。错误: {e}")
        return

    print(f"将要处理 {len(files_to_process)} 个文件。")

    # 遍历并处理每个文件
    for file_name in files_to_process:
        print(f"\n--- 正在处理文件: {file_name}.xlsx ---")
        
        try:
            response = requests.get(f"{API_BASE_URL}/data/{file_name}")
            response.raise_for_status()
            records = response.json()
        except requests.exceptions.RequestException as e:
            print(f"[错误] 获取文件 {file_name} 的数据失败: {e}")
            continue
        
        if not records:
            print(f"[警告] 文件 {file_name} 中没有数据。")
            continue

        processed_records = []
        for record in tqdm(records, desc=f"处理 {file_name}"):
            # 使用新函数处理整行记录
            processed_data = process_row_with_llm(record, file_name)
            
            # 合并结果
            if processed_data:
                combined_record = {**record, "llm_processed": processed_data}
                processed_records.append(combined_record)
            else:
                # 即使处理失败，也保留原始记录，并添加一个标记
                record["llm_processed"] = {"error": "Processing failed or no text found"}
                processed_records.append(record)
            
            time.sleep(0.05) # 轻微延迟，避免请求过于频繁

        # 保存处理后的数据
        output_path = os.path.join(PROCESSED_DATA_DIR, f"{file_name}.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(processed_records, f, ensure_ascii=False, indent=4)
        
        print(f"处理完成，结果已保存至: {output_path}")

    print("\n--- 所有文件处理完毕 ---")


if __name__ == "__main__":
    main()