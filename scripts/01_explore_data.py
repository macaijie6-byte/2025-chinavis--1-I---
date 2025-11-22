import os
import pandas as pd

def explore_data(root_dir):
    """
    遍历指定目录下的所有Excel文件，并打印每个工作表的前5行。
    """
    data_path = os.path.join(root_dir, '时空地理数据可视化——dataset', 'ChinaVis2025挑战赛数据')
    print(f"--- 开始扫描目录: {data_path} ---")

    if not os.path.exists(data_path):
        print(f"错误：找不到数据目录 {data_path}")
        print("请确认 '时空地理数据可视化——dataset' 文件夹已经正确移动到 'data' 目录下。")
        return

    for filename in os.listdir(data_path):
        if filename.endswith(".xlsx"):
            file_path = os.path.join(data_path, filename)
            print("\n" + "="*80)
            print(f"正在分析文件: {filename}")
            print("="*80)
            
            try:
                xls = pd.ExcelFile(file_path)
                sheet_names = xls.sheet_names
                print(f"  工作表 (Sheets): {sheet_names}")
                
                for sheet_name in sheet_names:
                    print("\n" + "-"*50)
                    print(f"  工作表名称: {sheet_name}")
                    print("-" * 50)
                    df = pd.read_excel(xls, sheet_name=sheet_name)
                    print("  前5行数据预览:")
                    print(df.head().to_string())
            except Exception as e:
                print(f"  处理文件 {filename} 时出错: {e}")

if __name__ == "__main__":
    # 获取当前脚本所在的目录，并推断出项目根目录
    # D:\DATA_Visualization\test5\scripts -> D:\DATA_Visualization\test5
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_root_dir = os.path.join(project_root, 'data')
    explore_data(data_root_dir)
    print("\n--- 数据扫描完成 ---")

