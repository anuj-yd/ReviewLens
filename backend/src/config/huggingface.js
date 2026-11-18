import { InferenceClient } from '@huggingface/inference'

let hfClient

export const getHFClient = () => {
  if (!process.env.HF_TOKEN) {
    throw new Error('HF_TOKEN is not configured.')
  }

  if (!hfClient) {
    hfClient = new InferenceClient(process.env.HF_TOKEN)
  }

  return hfClient
}

export const getHFModel = () => {
  return process.env.HF_MODEL || 'deepseek-ai/DeepSeek-V4.1-Flash:cheapest'
}
