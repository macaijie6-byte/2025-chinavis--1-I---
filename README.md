# 析城观史 - 北京历史时空演变可视分析系统

本项目是一个集成了时空数据可视化、AI 图像生成和 RAG 知识问答的历史数据分析平台。

## 📋 环境要求

- **Python**: 3.8 或更高版本 (建议使用 Anaconda)
- **Node.js**: 16.0 或更高版本
- **浏览器**: Chrome, Edge 或其他现代浏览器

## 🚀 快速开始

### 1. 后端服务 (Backend)

后端基于 FastAPI，负责提供数据接口、AI 图像生成和 RAG 问答服务。

**步骤：**

1.  **进入后端目录**：
    ```bash
    cd backend
    ```

2.  **安装依赖**：
    ```bash
    pip install -r requirements.txt
    ```
    *注意：如果安装 `volcengine-python-sdk[ark]` 失败，请尝试更新 pip 或手动安装。*

3.  **配置 API Key**：
    打开 `backend/main.py` 文件，找到以下配置区域，填入您的火山引擎（豆包）API Key 和 Endpoint ID：
    ```python
    # backend/main.py
    ARK_API_KEY = os.getenv("ARK_API_KEY", "您的API_KEY")
    ARK_ENDPOINT_ID = os.getenv("ARK_ENDPOINT_ID", "您的接入点ID")
    ```
    *   **API Key**: 获取自 [火山引擎控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/api-key)
    *   **Endpoint ID**: 获取自 [在线推理接入点](https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint) (请确保是**文生图**模型)

4.  **启动服务**：
    ```bash
    python main.py
    # 或者
    uvicorn main:app --reload
    ```
    服务默认运行在 `http://127.0.0.1:8000`。

### 2. 前端应用 (Frontend)

前端基于 React 和 Ant Design，提供交互式可视化界面。

**步骤：**

1.  **进入前端目录**：
    ```bash
    cd frontend/dashboard
    ```

2.  **安装依赖**：
    ```bash
    npm install
    ```

3.  **启动开发服务器**：
    ```bash
    npm run dev
    ```
    应用默认运行在 `http://localhost:5173`。

## 📖 功能使用说明

### 1. 历史文生图 (AI Image Generation)
*   **位置**：页面右侧中部。
*   **功能**：根据当前朝代的物产或自定义描述生成历史风格的图片。
*   **操作**：
    *   点击轮播图下方的“生成”按钮。
    *   系统将调用豆包大模型生成图片。
    *   *注意：如果未配置 API Key，系统将显示模拟图片。*

### 2. RAG 知识问答 (Knowledge Chat)
*   **位置**：页面右侧底部。
*   **功能**：基于项目内置的历史数据（建制、事件、人物、物产）回答您的问题。
*   **操作**：
    *   在输入框中输入问题（如：“析城山有哪些特产？”）。
    *   点击发送，AI 将结合历史数据为您解答。

### 3. 时空可视化视图
*   **朝代时间线**：点击顶部时间轴切换不同朝代，所有视图将联动更新。
*   **地理空间视图**：展示战争、事件的地理分布。
*   **桑基图/河流图**：展示城市演进和灾害程度变化。

## 🛠️ 常见问题排查

*   **Q: 图片生成一直显示“模拟图片”？**
    *   A: 请检查 `backend/main.py` 中的 `ARK_API_KEY` 和 `ARK_ENDPOINT_ID` 是否正确配置，并确保后端服务已重启。

*   **Q: RAG 问答提示“网络请求失败”？**
    *   A: 请确保后端服务正在运行 (`python backend/main.py`) 且端口 `8000` 未被占用。

*   **Q: 页面显示空白或报错？**
    *   A: 请检查浏览器控制台 (F12) 的错误信息，通常是由于数据文件缺失或网络连接问题。

---
*Created by GitHub Copilot*
