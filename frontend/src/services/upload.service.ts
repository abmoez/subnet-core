import api from '../lib/axios';
import { UploadResult, ApiResponse } from '../types';

function postForm(url: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<ApiResponse<UploadResult>>(url, formData, {
    headers: { 'Content-Type': undefined },
  });
}

export const uploadService = {
  async upload(file: File): Promise<UploadResult> {
    const { data } = await postForm('/upload', file);
    return data.data;
  },

  async uploadCsv(file: File): Promise<UploadResult> {
    const { data } = await postForm('/upload/csv', file);
    return data.data;
  },

  async uploadJson(file: File): Promise<UploadResult> {
    const { data } = await postForm('/upload/json', file);
    return data.data;
  },
};
