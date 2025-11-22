from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
from volcenginesdkarkruntime import Ark # 请确保已安装: pip install volcengine-python-sdk[ark]

app = FastAPI()

# --- 配置区域 ---
# 请在此处填入您的火山引擎(豆包) API Key 和 Endpoint ID
# https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint
ARK_API_KEY = os.getenv("ARK_API_KEY", "26b3a209-4c3d-4300-a5b9-c10968f9c99f")
# 豆包文生图模型的 Endpoint ID (例如: ep-20240604095608-xxxxx)
# 注意：您提供的 "doubao-seed-1-6-251015" 看起来像是一个对话(Chat)模型的接入点。
# 如果它是对话模型，下方的图片生成将会失败。如果是文生图模型，则可以正常工作。
ARK_ENDPOINT_ID = os.getenv("ARK_ENDPOINT_ID", "doubao-seed-1-6-251015")
# ----------------

# 设置 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源的请求，为了方便开发
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', '时空地理数据可视化——dataset', 'ChinaVis2025挑战赛数据')

class ImageGenRequest(BaseModel):
    prompt: str
    # model: str = "cogview-3" # 默认使用 CogView-3 (已废弃)

class ChatRequest(BaseModel):
    query: str

# --- RAG 简易实现 ---
RAG_DATA_CACHE = []

def load_rag_data():
    """
    加载用于 RAG 的关键数据文件。
    为了性能，我们只加载部分核心历史数据。
    """
    global RAG_DATA_CACHE
    if RAG_DATA_CACHE:
        return RAG_DATA_CACHE
    
    # 选择用于问答的核心文件
    target_files = [
        "07建制沿革 - 总数据和各朝代数据",
        "17事件 - 总数据和各朝代数据",
        "19人物 - 总数据和各朝代数据",
        "15物产 - 总数据和各朝代数据"
    ]
    
    print("Loading RAG data...")
    all_records = []
    for fname in target_files:
        fpath = os.path.join(DATA_DIR, f"{fname}.xlsx")
        if os.path.exists(fpath):
            try:
                df = pd.read_excel(fpath)
                # 将每一行转换为字符串描述
                # 假设第一列通常是 ID 或无关紧要，我们取所有列
                # 为了简化，我们将每一行转为 "列名:值; 列名:值..." 的格式
                records = df.to_dict(orient='records')
                for record in records:
                    # 过滤掉 None/NaN 值
                    clean_record = {k: v for k, v in record.items() if pd.notnull(v)}
                    text_repr = f"【来源:{fname}】 " + "; ".join([f"{k}:{v}" for k, v in clean_record.items()])
                    all_records.append(text_repr)
            except Exception as e:
                print(f"Error loading {fname}: {e}")
    
    RAG_DATA_CACHE = all_records
    print(f"Loaded {len(RAG_DATA_CACHE)} records for RAG.")
    return RAG_DATA_CACHE

def retrieve_context(query: str, top_k: int = 5) -> str:
    """
    简单的关键词检索
    """
    data = load_rag_data()
    if not data:
        return ""
    
    # 简单的关键词匹配打分
    # 将查询分词（这里简单按字或空格分）
    keywords = query.split()
    if not keywords:
        return ""
        
    scored_results = []
    for item in data:
        score = 0
        for kw in keywords:
            if kw in item:
                score += 1
        if score > 0:
            scored_results.append((score, item))
    
    # 按分数排序
    scored_results.sort(key=lambda x: x[0], reverse=True)
    
    # 取前 top_k
    top_results = [item for score, item in scored_results[:top_k]]
    return "\n".join(top_results)

@app.post("/api/chat")
def chat_with_rag(request: ChatRequest):
    """
    RAG 知识问答接口
    """
    context = retrieve_context(request.query)
    
    system_prompt = "你是一个精通中国历史的专家，特别是关于析城山地区的历史。请根据提供的上下文信息回答用户的问题。如果上下文中没有答案，请利用你自己的知识回答，但要说明是基于通用知识。"
    user_prompt = f"上下文信息：\n{context}\n\n用户问题：{request.query}"
    
    try:
        # 初始化 Ark 客户端
        client = Ark(
            api_key=ARK_API_KEY,
            base_url="https://ark.cn-beijing.volces.com/api/v3"
        )
        
        completion = client.chat.completions.create(
            model=ARK_ENDPOINT_ID, # 使用同一个 Endpoint，假设它支持 Chat
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        
        return {"answer": completion.choices[0].message.content, "context_used": context}
        
    except Exception as e:
        print(f"Chat error: {e}")
        return {"answer": "抱歉，我现在无法回答这个问题。请检查后端日志。", "error": str(e)}

@app.post("/api/generate-image")
def generate_image(request: ImageGenRequest):
    """
    调用火山引擎(豆包) Ark 模型生成图片
    """
    if "您的ARK_API_KEY_在这里" in ARK_API_KEY or "您的ARK_ENDPOINT_ID_在这里" in ARK_ENDPOINT_ID:
         # 如果没有配置 Key，返回模拟数据或错误
         import time
         time.sleep(1)
         return {
             "url": f"https://picsum.photos/seed/{hash(request.prompt) % 1000}/400/250", 
             "note": "这是模拟图片。请在 backend/main.py 中配置 ARK_API_KEY 和 ARK_ENDPOINT_ID 以启用真实生成。"
         }

    try:
        print(f"Using Ark API Key: {ARK_API_KEY[:5]}***") # Debug print
        # 初始化 Ark 客户端，指定 base_url
        client = Ark(
            api_key=ARK_API_KEY,
            base_url="https://ark.cn-beijing.volces.com/api/v3"
        )
        
        # 豆包文生图调用方式
        response = client.images.generations(
            model=ARK_ENDPOINT_ID,
            prompt=request.prompt,
        )
        
        # Ark 返回结构通常也是 response.data[0].url
        if response.data and len(response.data) > 0:
            return {"url": response.data[0].url}
        else:
            raise HTTPException(status_code=500, detail="生成失败，未返回图片URL")
    except Exception as e:
        print(f"Image generation error: {e}")
        # 发生错误时（如Key无效），回退到模拟图片，保证前端不崩
        return {
             "url": f"https://picsum.photos/seed/{hash(request.prompt) % 1000}/400/250", 
             "note": f"生成出错 ({str(e)})，已回退到模拟图片。"
         }

@app.get("/")
def read_root():
    return {"message": "欢迎来到「析城观史」项目后端服务"}

@app.get("/api/data/{file_name}")
def get_excel_data(file_name: str):
    """
    读取指定名称的 Excel 文件并返回 JSON 数据。
    文件名不需要带 .xlsx 后缀。
    """
    file_path = os.path.join(DATA_DIR, f"{file_name}.xlsx")
    if not os.path.exists(file_path):
        return {"error": "文件未找到"}
    
    try:
        df = pd.read_excel(file_path)
        # 将 NaN 替换为 None，以便 JSON 序列化
        df = df.where(pd.notnull(df), None)
        return df.to_dict(orient="records")
    except Exception as e:
        return {"error": f"读取或处理文件时出错: {str(e)}"}

@app.get("/api/files")
def list_data_files():
    """
    列出数据目录下的所有 Excel 文件。
    """
    try:
        files = [f.replace('.xlsx', '') for f in os.listdir(DATA_DIR) if f.endswith('.xlsx')]
        return {"files": files}
    except Exception as e:
        return {"error": f"读取文件列表时出错: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
