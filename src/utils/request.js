// src/utils/request.js - 统一请求封装（适配React项目）
// 与后端 common/response.js 对齐：成功返回 data，失败 reject msg
import axios from 'axios';

// 创建axios实例
const request = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  timeout: 30000, // 部分接口（如同步）耗时较长，放宽到 30s
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 请求拦截器：注入 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求拦截器错误：', error);
    return Promise.reject(error);
  }
);

// 响应拦截器：统一解包后端 { code, msg, data } 结构
// 成功返回 data，失败抛出 msg 字符串
request.interceptors.response.use(
  (response) => {
    const res = response.data;

    // 兼容非标准响应（如直接返回数组/字符串、文件下载等）
    if (res === null || typeof res !== 'object' || Array.isArray(res)) {
      return res;
    }

    // 标准 { code, msg, data } 结构
    if (typeof res.code !== 'undefined') {
      if (res.code === 200) {
        return res.data;
      }
      console.error('接口返回错误：', res.msg);
      return Promise.reject(new Error(res.msg || '接口请求失败'));
    }

    // 无 code 字段时直接返回原始数据
    return res;
  },
  (error) => {
    console.error('响应拦截器错误：', error);
    // 处理 HTTP 状态码错误
    const status = error.response?.status;
    const errMsg = error.response?.data?.msg || error.message || '网络异常，请重试';

    // 401: 未授权，清除 token 并跳登录（如后续接入登录）
    if (status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      // 不在此处强跳，避免与登录页耦合；交由调用方处理
    }

    return Promise.reject(new Error(errMsg));
  }
);

export default request;
