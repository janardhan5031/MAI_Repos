import "dotenv/config";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export class AxiosService {
  public static async get<T>(
    url: string,
    res: any,
    config?: AxiosRequestConfig
  ): Promise<any> {
    const response: AxiosResponse<any> = await axios.get(url, config);
    return response;
  }

  public static async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<any> {
    const response: AxiosResponse<any> = await axios.post(url, data, config);
    return response;
  }

  public static async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<any> {
    const response: AxiosResponse<T> = await axios.put(url, data, config);
    return response;
  }

  public static async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<any> {
    const response: AxiosResponse<T> = await axios.delete(url, config);
    return response;
  }
}
