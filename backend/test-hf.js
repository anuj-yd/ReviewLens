import 'dotenv/config'

import { getHFClient, getHFModel } from './src/config/huggingface.js'

const testHF = async () => {

  try {

    const hf = getHFClient()

    console.log('Testing Hugging Face...')
    console.log('Model:', getHFModel())

    const response = await hf.chatCompletion({

      model: getHFModel(),

      messages: [
        {
          role: 'user',
          content: 'Reply with exactly one word: SUCCESS'
        }
      ],

      max_tokens: 20,

      temperature: 0

    })

    console.log('Connection successful!')

    console.log(
      response.choices[0].message.content
    )

  } catch (error) {

    console.error('Hugging Face connection failed:')

    console.error({
      name: error.name,
      message: error.message,
      status: error.status
    })

  }

}

testHF()