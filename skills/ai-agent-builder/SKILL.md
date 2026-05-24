---
name: ai-agent-builder
description: Expert in building autonomous AI agents using LangChain, LlamaIndex, CrewAI, and multi-agent orchestration patterns. Use when you need help with ai agent builder.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: ai-ml
---

# AI Agent Builder Expert Mode

You are an expert in building autonomous AI agents. You create sophisticated agent systems using modern frameworks like LangChain, LlamaIndex, and CrewAI with proper tool use, memory, and orchestration.

## Core Competencies

### Agent Frameworks

- LangChain agents and tools
- LlamaIndex data agents
- CrewAI multi-agent systems
- AutoGPT patterns
- Function calling

## Agent Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                      AI Agent System                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Orchestrator                         │    │
│  │         (Planning, Routing, Coordination)               │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────────────┼───────────────────────────────┐    │
│  │                    Agent Layer                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │
│  │  │ Research │  │ Coding   │  │ Analysis │             │    │
│  │  │  Agent   │  │  Agent   │  │  Agent   │             │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘             │    │
│  └───────┼─────────────┼─────────────┼─────────────────────┘    │
│          │             │             │                           │
│  ┌───────┼─────────────┼─────────────┼─────────────────────┐    │
│  │       │        Tool Layer         │                      │    │
│  │  ┌────▼────┐ ┌────▼────┐ ┌───▼────┐ ┌────────┐        │    │
│  │  │ Search  │ │  Code   │ │  SQL   │ │  API   │        │    │
│  │  │  Tool   │ │  Exec   │ │ Query  │ │ Caller │        │    │
│  │  └─────────┘ └─────────┘ └────────┘ └────────┘        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Memory Layer                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │  Short   │  │  Long    │  │  Vector  │               │   │
│  │  │  Term    │  │  Term    │  │  Store   │               │   │
│  │  └──────────┘  └──────────┘  └──────────┘               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## LangChain Agent Implementation

### Basic ReAct Agent

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool, StructuredTool
from langchain import hub
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
import requests

# Initialize LLM
llm = ChatOpenAI(model="gpt-4-turbo", temperature=0)

# Define tools
def search_web(query: str) -> str:
    """Search the web for information."""
    # Implement with your preferred search API
    response = requests.get(
        "https://api.search.example.com/search",
        params={"q": query}
    )
    return response.json()["results"][:3]

def calculate(expression: str) -> str:
    """Evaluate a mathematical expression."""
    try:
        result = eval(expression)  # Use safer evaluation in production
        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"

class CodeExecutionInput(BaseModel):
    code: str = Field(description="Python code to execute")
    language: str = Field(default="python", description="Programming language")

def execute_code(code: str, language: str = "python") -> str:
    """Execute code in a sandboxed environment."""
    # Use a sandboxed execution environment
    import subprocess
    result = subprocess.run(
        ["python", "-c", code],
        capture_output=True,
        text=True,
        timeout=30
    )
    return result.stdout or result.stderr

# Create tool list
tools = [
    Tool(
        name="WebSearch",
        func=search_web,
        description="Search the web for current information. Input: search query string."
    ),
    Tool(
        name="Calculator",
        func=calculate,
        description="Evaluate mathematical expressions. Input: math expression as string."
    ),
    StructuredTool.from_function(
        func=execute_code,
        name="CodeExecution",
        description="Execute Python code and return output.",
        args_schema=CodeExecutionInput,
    ),
]

# Get ReAct prompt from hub or create custom
prompt = hub.pull("hwchase17/react")

# Or custom prompt
custom_prompt = PromptTemplate.from_template("""
You are a helpful AI assistant with access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}
""")

# Create agent
agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=10,
    handle_parsing_errors=True,
)

# Run agent
result = agent_executor.invoke({
    "input": "What is the population of Tokyo, and what is that divided by 3?"
})
print(result["output"])
```

### OpenAI Function Calling Agent

```python
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Optional
import json

# Define tools with @tool decorator
@tool
def get_weather(location: str, unit: str = "celsius") -> str:
    """Get the current weather for a location.

    Args:
        location: The city and state/country, e.g., "San Francisco, CA"
        unit: Temperature unit, either "celsius" or "fahrenheit"
    """
    # Mock implementation
    return json.dumps({
        "location": location,
        "temperature": 22 if unit == "celsius" else 72,
        "unit": unit,
        "conditions": "sunny"
    })

@tool
def search_database(query: str, limit: int = 10) -> str:
    """Search the internal database for relevant information.

    Args:
        query: The search query
        limit: Maximum number of results to return
    """
    # Mock database search
    return json.dumps({
        "query": query,
        "results": [
            {"id": 1, "title": "Result 1", "relevance": 0.95},
            {"id": 2, "title": "Result 2", "relevance": 0.87},
        ][:limit]
    })

@tool
def send_email(to: str, subject: str, body: str) -> str:
    """Send an email to a recipient.

    Args:
        to: Email address of the recipient
        subject: Email subject line
        body: Email body content
    """
    # Mock email sending
    return f"Email sent successfully to {to}"

tools = [get_weather, search_database, send_email]

# Create prompt with memory
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful AI assistant with access to various tools.
    Always use the appropriate tool when needed.
    Be concise but thorough in your responses."""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# Create agent
llm = ChatOpenAI(model="gpt-4-turbo", temperature=0)
agent = create_openai_functions_agent(llm, tools, prompt)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    return_intermediate_steps=True,
)

# Run with conversation history
chat_history = [
    HumanMessage(content="My name is Alice"),
    AIMessage(content="Hello Alice! How can I help you today?"),
]

result = agent_executor.invoke({
    "input": "What's the weather in Tokyo and send that info to bob@example.com",
    "chat_history": chat_history,
})

print(result["output"])
```

## CrewAI Multi-Agent System

```python
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, WebsiteSearchTool
from langchain_openai import ChatOpenAI

# Initialize tools
search_tool = SerperDevTool()
web_tool = WebsiteSearchTool()

# Define specialized agents
researcher = Agent(
    role="Senior Research Analyst",
    goal="Uncover cutting-edge developments and trends in AI",
    backstory="""You are a seasoned researcher with a keen eye for emerging trends.
    You excel at synthesizing information from multiple sources.""",
    verbose=True,
    allow_delegation=True,
    tools=[search_tool, web_tool],
    llm=ChatOpenAI(model="gpt-4-turbo"),
)

writer = Agent(
    role="Tech Content Strategist",
    goal="Craft compelling content about AI discoveries",
    backstory="""You are a skilled writer who transforms complex technical
    information into engaging, accessible content.""",
    verbose=True,
    allow_delegation=False,
    llm=ChatOpenAI(model="gpt-4-turbo"),
)

editor = Agent(
    role="Senior Editor",
    goal="Ensure content quality and accuracy",
    backstory="""You are a meticulous editor with expertise in technical
    writing and fact-checking.""",
    verbose=True,
    allow_delegation=False,
    llm=ChatOpenAI(model="gpt-4-turbo"),
)

# Define tasks
research_task = Task(
    description="""Conduct comprehensive research on the latest AI agent frameworks.
    Focus on: LangChain, LlamaIndex, CrewAI, AutoGen.
    Identify key features, use cases, and recent updates.""",
    expected_output="""A detailed research report covering:
    - Overview of each framework
    - Key features and capabilities
    - Recent developments and updates
    - Comparison of strengths and weaknesses""",
    agent=researcher,
)

writing_task = Task(
    description="""Using the research findings, write an engaging blog post
    about AI agent frameworks for a developer audience.""",
    expected_output="""A well-structured blog post (1500+ words) including:
    - Compelling introduction
    - Framework comparisons with code examples
    - Practical use cases
    - Future outlook
    - Call to action""",
    agent=writer,
    context=[research_task],  # Uses output from research task
)

editing_task = Task(
    description="""Review and edit the blog post for clarity, accuracy,
    and engagement. Ensure technical accuracy and readability.""",
    expected_output="""Final polished blog post with:
    - Corrected grammar and style
    - Verified technical accuracy
    - Improved flow and readability
    - SEO-optimized headings""",
    agent=editor,
    context=[writing_task],
)

# Create crew
crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research_task, writing_task, editing_task],
    process=Process.sequential,  # or Process.hierarchical
    verbose=True,
)

# Execute
result = crew.kickoff()
print(result)
```

## LlamaIndex Data Agents

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.core.tools import QueryEngineTool, ToolMetadata
from llama_index.core.agent import ReActAgent
from llama_index.llms.openai import OpenAI
from llama_index.core.memory import ChatMemoryBuffer

# Load documents and create index
documents = SimpleDirectoryReader("./data").load_data()
index = VectorStoreIndex.from_documents(documents)

# Create query engine tools
query_engine = index.as_query_engine(similarity_top_k=3)

query_tool = QueryEngineTool(
    query_engine=query_engine,
    metadata=ToolMetadata(
        name="document_search",
        description="""Search through company documents including policies,
        procedures, and technical documentation. Use for specific questions
        about company processes or technical details.""",
    ),
)

# Create additional tools
from llama_index.core.tools import FunctionTool

def get_current_date() -> str:
    """Get the current date and time."""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def calculate_days_between(start_date: str, end_date: str) -> int:
    """Calculate the number of days between two dates.

    Args:
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
    """
    from datetime import datetime
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    return abs((end - start).days)

date_tool = FunctionTool.from_defaults(fn=get_current_date)
calc_tool = FunctionTool.from_defaults(fn=calculate_days_between)

# Create agent with memory
memory = ChatMemoryBuffer.from_defaults(token_limit=4096)

agent = ReActAgent.from_tools(
    tools=[query_tool, date_tool, calc_tool],
    llm=OpenAI(model="gpt-4-turbo"),
    memory=memory,
    verbose=True,
    max_iterations=10,
)

# Chat with agent
response = agent.chat("What is the vacation policy and how many days until end of year?")
print(response)
```

## Custom Tool Creation

```python
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Type, Optional
import aiohttp
import asyncio

class APIToolInput(BaseModel):
    endpoint: str = Field(description="API endpoint path")
    method: str = Field(default="GET", description="HTTP method")
    payload: Optional[dict] = Field(default=None, description="Request payload")

class APITool(BaseTool):
    """Custom tool for making API calls."""

    name: str = "api_caller"
    description: str = """Make HTTP requests to external APIs.
    Useful for fetching data or triggering actions via APIs."""
    args_schema: Type[BaseModel] = APIToolInput
    base_url: str = "https://api.example.com"

    def _run(
        self,
        endpoint: str,
        method: str = "GET",
        payload: Optional[dict] = None
    ) -> str:
        """Synchronous execution."""
        return asyncio.run(self._arun(endpoint, method, payload))

    async def _arun(
        self,
        endpoint: str,
        method: str = "GET",
        payload: Optional[dict] = None
    ) -> str:
        """Asynchronous execution."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url=url,
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return json.dumps(data, indent=2)
                else:
                    return f"Error: {response.status}"

# SQL Query Tool
class SQLQueryInput(BaseModel):
    query: str = Field(description="SQL query to execute")

class SQLQueryTool(BaseTool):
    """Tool for executing SQL queries."""

    name: str = "sql_query"
    description: str = """Execute SQL queries against the database.
    Use for data retrieval and analysis. Only SELECT queries allowed."""
    args_schema: Type[BaseModel] = SQLQueryInput

    def __init__(self, connection_string: str, **kwargs):
        super().__init__(**kwargs)
        self._connection_string = connection_string

    def _run(self, query: str) -> str:
        import sqlalchemy
        from sqlalchemy import text

        # Safety check - only allow SELECT
        if not query.strip().upper().startswith("SELECT"):
            return "Error: Only SELECT queries are allowed"

        engine = sqlalchemy.create_engine(self._connection_string)
        with engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()
            columns = result.keys()

            # Format as table
            output = " | ".join(columns) + "\n"
            output += "-" * len(output) + "\n"
            for row in rows[:50]:  # Limit results
                output += " | ".join(str(v) for v in row) + "\n"

            return output

    async def _arun(self, query: str) -> str:
        return self._run(query)
```

## Memory Systems

```python
from langchain.memory import (
    ConversationBufferMemory,
    ConversationSummaryMemory,
    ConversationBufferWindowMemory,
    VectorStoreRetrieverMemory,
)
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# Simple buffer memory
buffer_memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
)

# Windowed memory (last N interactions)
window_memory = ConversationBufferWindowMemory(
    k=10,
    memory_key="chat_history",
    return_messages=True,
)

# Summary memory (condensed history)
summary_memory = ConversationSummaryMemory(
    llm=ChatOpenAI(temperature=0),
    memory_key="chat_history",
    return_messages=True,
)

# Vector store memory (semantic search over history)
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(
    collection_name="agent_memory",
    embedding_function=embeddings,
)

vector_memory = VectorStoreRetrieverMemory(
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    memory_key="relevant_history",
)

# Combine memories
from langchain.memory import CombinedMemory

combined_memory = CombinedMemory(memories=[window_memory, vector_memory])

# Use in agent
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=combined_memory,
    verbose=True,
)
```

## Agent Orchestration Patterns

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
import operator

# Define state
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    next: str
    research_results: str
    draft: str
    final_output: str

# Define node functions
def research_node(state: AgentState) -> AgentState:
    """Research agent node."""
    # Run research agent
    result = research_agent.invoke({"input": state["messages"][-1].content})
    return {
        "research_results": result["output"],
        "next": "writer"
    }

def writer_node(state: AgentState) -> AgentState:
    """Writer agent node."""
    # Use research results to write
    result = writer_agent.invoke({
        "input": f"Write based on: {state['research_results']}"
    })
    return {
        "draft": result["output"],
        "next": "reviewer"
    }

def reviewer_node(state: AgentState) -> AgentState:
    """Reviewer agent node."""
    result = reviewer_agent.invoke({
        "input": f"Review this: {state['draft']}"
    })
    return {
        "final_output": result["output"],
        "next": "end"
    }

def router(state: AgentState) -> str:
    """Route to next node."""
    return state.get("next", "research")

# Build graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("research", research_node)
workflow.add_node("writer", writer_node)
workflow.add_node("reviewer", reviewer_node)

# Add edges
workflow.add_conditional_edges(
    "research",
    router,
    {"writer": "writer", "end": END}
)
workflow.add_conditional_edges(
    "writer",
    router,
    {"reviewer": "reviewer", "end": END}
)
workflow.add_conditional_edges(
    "reviewer",
    router,
    {"end": END}
)

# Set entry point
workflow.set_entry_point("research")

# Compile and run
app = workflow.compile()
result = app.invoke({
    "messages": [HumanMessage(content="Write about AI agents")],
    "next": "research",
})
```

## Evaluation and Monitoring

```python
from langsmith import Client
from langsmith.evaluation import evaluate

# Initialize LangSmith client
client = Client()

# Define evaluation dataset
dataset = client.create_dataset("agent_eval")

# Add examples
client.create_examples(
    inputs=[
        {"input": "What is 2+2?"},
        {"input": "Search for the latest AI news"},
    ],
    outputs=[
        {"expected": "4"},
        {"expected": "Contains news results"},
    ],
    dataset_id=dataset.id,
)

# Define evaluator
def accuracy_evaluator(run, example):
    """Check if output matches expected."""
    output = run.outputs.get("output", "")
    expected = example.outputs.get("expected", "")

    if expected in output:
        return {"score": 1.0, "key": "accuracy"}
    return {"score": 0.0, "key": "accuracy"}

# Run evaluation
results = evaluate(
    agent_executor.invoke,
    data=dataset.name,
    evaluators=[accuracy_evaluator],
)
```

## Output Format

Provide:

- Agent implementations with tools
- Multi-agent orchestration patterns
- Memory and state management
- Evaluation strategies
- Production deployment patterns

Sources:

- [LangChain Agents](https://python.langchain.com/docs/modules/agents/)
- [CrewAI Documentation](https://docs.crewai.com/)
- [LlamaIndex Agents](https://docs.llamaindex.ai/en/stable/module_guides/deploying/agents/)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
