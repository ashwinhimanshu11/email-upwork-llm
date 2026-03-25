# Project Proposal: Personal Email LLM Assistant

**Goal:** Build an AI-powered system that can index, retrieve, and answer questions based on a user's email history using **RAG (Retrieval-Augmented Generation)**.

---

## 1. System Architecture

The system follows a two-part pipeline: **Data Ingestion** (Building the memory) and **Inference** (Asking the questions).

### A. Ingestion Pipeline

1. **Extraction:** Connect to Gmail/Outlook API or IMAP to fetch emails.
2. **Cleaning:** Strip HTML, remove signatures/disclaimers, and handle attachments.
3. **Chunking:** Break long threads into smaller text segments (chunks).
4. **Vectorization:** Convert text chunks into mathematical vectors using an Embedding Model.
5. **Storage:** Save vectors into a **Vector Database** (ChromaDB or Pinecone).

### B. Inference Pipeline (The Q&A Flow)

1. **Query:** User asks a question (e.g., *"When is my meeting with the jewelry client?"*).
2. **Retrieval:** The system searches the Vector Database for the most relevant email chunks.
3. **Augmentation:** The system combines the user's question with the retrieved chunks as "context."
4. **Generation:** The LLM reads the context and provides a grounded, factual answer.

---

## 2. Technical Stack

| Category | Recommended Tool | Why? |
| --- | --- | --- |
| **Language** | Python 3.10+ | Primary language for AI/ML and API scripting. |
| **Orchestration** | **LangChain** or **LlamaIndex** | Standard frameworks for connecting data to LLMs. |
| **Vector DB** | **ChromaDB** | Open-source, local, and very easy to set up. |
| **LLM (Cloud)** | GPT-4o / Claude 3.5 | Best performance; requires API keys. |
| **LLM (Local)** | **Ollama** (Llama 3) | 100% private; runs on your local GPU. |
| **API/Backend** | FastAPI | High-performance Python web framework. |

---

## 3. Implementation Roadmap

### Phase 1: Data Preparation

* Set up a Google Cloud Project to enable the **Gmail API**.
* Write a Python script to download emails in JSON format.
* Implement a "cleaning" function to remove noise (advertisements, spam, and footer text).

### Phase 2: Building the "Brain"

* Initialize **ChromaDB**.
* Use an embedding model (like `all-MiniLM-L6-v2` for local or OpenAI's `text-embedding-3-small`) to index the cleaned emails.
* Test retrieval: Ask the database for a specific keyword and see if it returns the correct email.

### Phase 3: The LLM Logic

* Connect the retriever to the LLM via **LangChain**.
* Write a "System Prompt" that tells the AI: *"You are an email assistant. Only use the provided emails to answer. If the answer isn't there, say you don't know."*

### Phase 4: UI & Deployment

* Build a simple **Streamlit** or **React** dashboard.
* Add filters for "Date Range" or "Sender" to help the AI narrow its search.

---

## 4. Key Challenges & Solutions

> **Challenge:** Email threads are messy and out of order.
> **Solution:** Group emails by `threadId` before chunking to maintain conversation flow.

> **Challenge:** Privacy and sensitive data.
> **Solution:** Use a **Local LLM** (via Ollama) so no personal information ever leaves your machine.

---

## 5. Security Checklist

* [ ] Use **OAuth2** for email access (never hardcode passwords).
* [ ] Ensure the local Vector DB is encrypted.
* [ ] Set up an `.env` file for all API keys and credentials.