from langchain.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnablePassthrough
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS

from langchain_community.document_loaders import PyPDFLoader  #PDFPlumberLoader, UnstructuredPDFLoader can also be used
from langchain_groq import ChatGroq
from dotenv import load_dotenv
load_dotenv()


embedding_model = HuggingFaceInferenceAPIEmbeddings(
    model_name="BAAI/bge-base-en-v1.5"
)

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0
)

 
parser = StrOutputParser()

# step1: loading pdf
loader = PyPDFLoader('file1.pdf')
book = loader.load()
# print(book[338].page_content)


# step2 : splitting text
splitter = RecursiveCharacterTextSplitter(chunk_size = 500, chunk_overlap = 100)
chunks = splitter.split_documents(book)
# print('chunks are : ', chunks[0])


# step3 : making embeddings of the chunks and save too vector_db
vector_store = FAISS.from_documents(
  chunks,
  embedding_model)


# step5 : retrieving the context
retriever = vector_store.as_retriever(search_type = 'similarity', search_kwargs = {'k' : 8})
# result = retriever.invoke('Who wrote The Accidental CTO?')
# print(result)

# step6 : augumenting the context + question
prompt = PromptTemplate(
    template="""
      You are a helpful assistant.
      Answer ONLY from the provided context.
      If the context is insufficient, just say you don't know.

      {context}
      Question: {user_query}
    """,
    input_variables= ['user_query', 'context']
)


# step7 : generating the output of the question 
user_query = str(input('Enter your question : '))


def format_docs(retrieved_docs):
  context_text = "\n\n".join(doc.page_content.strip() for doc in retrieved_docs)
  return context_text

parallel_chain = RunnableParallel({
    'user_query': RunnablePassthrough(),
    'context': retriever|RunnableLambda(format_docs)
})


main_chain = parallel_chain | prompt | llm | parser
answer = main_chain.invoke(user_query)
print(answer)
