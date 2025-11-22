import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 获取所有处理过的数据文件名列表
 * @returns {Promise<string[]>}
 */
export const getDataFiles = async () => {
  try {
    const response = await apiClient.get('/files');
    // 我们假设后端返回的已经是处理过的 .json 文件名列表
    // 如果后端返回的是 .xlsx，我们需要在这里调整
    return response.data.files.map(f => f.replace('.xlsx', ''));
  } catch (error) {
    console.error("获取文件列表失败:", error);
    return [];
  }
};

/**
 * 根据文件名获取对应的 JSON 数据
 * @param {string} fileName - 文件名 (不带后缀)
 * @returns {Promise<Object[]>}
 */
export const getJsonData = async (fileName) => {
  try {
    // 注意：我们将从 processed 目录获取数据，因此需要一个新的后端路由
    // 我们暂时假设后端 API 能够智能处理，如果不行则需要修改后端
    // 为了简单起见，我们直接请求 public 目录下的文件
    const response = await axios.get(`/processed/${fileName}.json`);
    return response.data;
  } catch (error) {
    console.error(`获取文件 ${fileName}.json 失败:`, error);
    return [];
  }
};

/**
 * 调用后端生成图片
 * @param {string} prompt - 图片描述提示词
 * @returns {Promise<{url: string, note?: string}>}
 */
export const generateImage = async (prompt) => {
  try {
    const response = await apiClient.post('/generate-image', { prompt });
    return response.data;
  } catch (error) {
    console.error("生成图片失败:", error);
    // Fallback mock
    return { 
      url: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/400/250`,
      note: "网络请求失败，使用本地模拟图片"
    };
  }
};

/**
 * RAG 知识问答
 * @param {string} query - 用户问题
 * @returns {Promise<{answer: string, context_used?: string}>}
 */
export const chatWithRag = async (query) => {
  try {
    const response = await apiClient.post('/chat', { query });
    return response.data;
  } catch (error) {
    console.error("RAG 请求失败:", error);
    return { answer: "抱歉，网络请求失败，请检查后端服务。" };
  }
};
