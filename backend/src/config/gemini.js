import { GoogleGenAI } from '@google/genai'

let geminiClient

export const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  }

  return geminiClient
}

export const getGeminiModel = () => {
  return process.env.GEMINI_MODEL || 'gemini-3.8-flash'
}