# Copyright IBM Corp. 2025
from langchain_ibm import WatsonxLLM
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import os
from dotenv import load_dotenv
load_dotenv()
parameters = {
    "decoding_method": "sample",
    "max_new_tokens": 100,
    "min_new_tokens": 1,
    "temperature": 0.5,
    "top_k": 50,
    "top_p": 1,
}

watsonx_llm = WatsonxLLM(
    model_id=os.getenv('ModelId'),
    url = os.getenv('WX_Url'),
    project_id = os.getenv('WX_ProjectId'),
    params=parameters,
    apikey= os.getenv('WX_ApiKey'),
)

question_prompt_template = """
Agent: Okay, I am awaiting your instructions
User: Watson, here are your instructions:
1. You will be given a document that should be used to reply to user questions.
2. You should generate the next response using information available in the document.
3. If you can't find an answer, say 'I don't know'.
4. Your responses should include an answer and explanation.  Your responses should have about 2-5 sentences.
5. You should not repeat your answers.
6. Do not use any other sources of information.
"""

def makeFinalPrompt(instructions):
    finalPromptTemplate = instructions + """
    User: Use the context provided below and follow the above instruction.
    {context}
    Agent: I am ready to answer your questions from the document. I will not repeat answers I have given.
    User: {question}
    Agent:
    """

    finalPrompt = PromptTemplate(
        template=finalPromptTemplate, input_variables=["context", "question"]
    )

    return finalPrompt

def requirementQuery(query, requirements):
    question_prompt = makeFinalPrompt(question_prompt_template)
    question_chain = LLMChain(llm=watsonx_llm, prompt=question_prompt, output_key='answer')
    context = getContext(query,requirements)
    print('query',query)
    print('context',context)
    answer = question_chain.invoke({'question': query, 'context': context})['answer']
    print('answer',answer)
    # TODO: improve prompt so we do not have to truncate answer
    index = answer.find('User:')
    return answer[0:index]


def getContext(query,requirements):
    data = requirements
    context = ''
    for requirement in data['requirements']:
        context += requirement['text'] + '\n'
    return context