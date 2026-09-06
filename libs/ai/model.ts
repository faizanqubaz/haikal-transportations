import {ChatGoogleGenerativeAI} from '@langchain/google-genai';


const modelName = process.env.MODEL_NAME || 'gemini-3.7-flash';
const GEMNAI_API_KEY = process.env.GEMNAI_API_KEY;


    export  const model = new ChatGoogleGenerativeAI({
        model:modelName,
        temperature:0,
        apiKey:GEMNAI_API_KEY
     })
