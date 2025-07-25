// Axie Studio Template Management System
// Manages templates with complete white-label support

import { enhancedMiddleman } from './enhanced-middleman';

export interface AxieStudioTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Chat' | 'RAG' | 'Agents' | 'Data Processing' | 'Custom';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  data: {
    nodes: any[];
    edges: any[];
    viewport: { x: number; y: number; zoom: number };
  };
  metadata: {
    created_with: string;
    version: string;
    author: string;
    tags: string[];
    estimated_time: string;
    requirements: string[];
  };
  thumbnail?: string;
  is_premium?: boolean;
  white_label_compatible: boolean;
}

export class TemplateManager {
  private templates: AxieStudioTemplate[] = [];

  constructor() {
    this.initializeAxieStudioTemplates();
  }

  private initializeAxieStudioTemplates() {
    this.templates = [
      {
        id: 'axie-basic-chatbot',
        name: 'Axie Studio Basic Chatbot',
        description: 'A simple, powerful chatbot template perfect for getting started with AI conversations.',
        category: 'Chat',
        difficulty: 'Beginner',
        data: {
          nodes: [
            {
              id: 'chat-input-1',
              type: 'ChatInput',
              position: { x: 100, y: 100 },
              data: {
                display_name: 'Chat Input',
                description: 'Receive user messages',
                template: {
                  sender: { value: 'User' },
                  message: { value: '' },
                  session_id: { value: '' }
                }
              }
            },
            {
              id: 'openai-1',
              type: 'OpenAI',
              position: { x: 400, y: 100 },
              data: {
                display_name: 'OpenAI',
                description: 'Generate AI responses',
                template: {
                  model: { value: 'gpt-3.5-turbo' },
                  temperature: { value: 0.7 },
                  max_tokens: { value: 1000 }
                }
              }
            },
            {
              id: 'chat-output-1',
              type: 'ChatOutput',
              position: { x: 700, y: 100 },
              data: {
                display_name: 'Chat Output',
                description: 'Display AI responses',
                template: {
                  sender: { value: 'AI Assistant' },
                  message: { value: '' },
                  session_id: { value: '' }
                }
              }
            }
          ],
          edges: [
            {
              id: 'edge-1',
              source: 'chat-input-1',
              target: 'openai-1',
              sourceHandle: 'message',
              targetHandle: 'input'
            },
            {
              id: 'edge-2',
              source: 'openai-1',
              target: 'chat-output-1',
              sourceHandle: 'output',
              targetHandle: 'message'
            }
          ],
          viewport: { x: 0, y: 0, zoom: 1 }
        },
        metadata: {
          created_with: 'Axie Studio',
          version: '1.0.0',
          author: 'Axie Studio Team',
          tags: ['chat', 'openai', 'beginner', 'basic'],
          estimated_time: '5 minutes',
          requirements: ['OpenAI API Key']
        },
        white_label_compatible: true
      },
      {
        id: 'axie-rag-document-qa',
        name: 'Axie Studio Document Q&A',
        description: 'Upload documents and ask questions about their content using advanced RAG techniques.',
        category: 'RAG',
        difficulty: 'Intermediate',
        data: {
          nodes: [
            {
              id: 'file-input-1',
              type: 'FileInput',
              position: { x: 50, y: 50 },
              data: {
                display_name: 'Document Upload',
                description: 'Upload PDF, TXT, or DOCX files'
              }
            },
            {
              id: 'text-splitter-1',
              type: 'TextSplitter',
              position: { x: 300, y: 50 },
              data: {
                display_name: 'Text Splitter',
                description: 'Split documents into chunks'
              }
            },
            {
              id: 'embeddings-1',
              type: 'OpenAIEmbeddings',
              position: { x: 550, y: 50 },
              data: {
                display_name: 'Create Embeddings',
                description: 'Convert text to vector embeddings'
              }
            },
            {
              id: 'vector-store-1',
              type: 'Chroma',
              position: { x: 800, y: 50 },
              data: {
                display_name: 'Vector Store',
                description: 'Store document embeddings'
              }
            },
            {
              id: 'chat-input-1',
              type: 'ChatInput',
              position: { x: 50, y: 300 },
              data: {
                display_name: 'Question Input',
                description: 'Ask questions about documents'
              }
            },
            {
              id: 'retriever-1',
              type: 'VectorStoreRetriever',
              position: { x: 300, y: 300 },
              data: {
                display_name: 'Document Retriever',
                description: 'Find relevant document sections'
              }
            },
            {
              id: 'prompt-1',
              type: 'PromptTemplate',
              position: { x: 550, y: 300 },
              data: {
                display_name: 'QA Prompt',
                description: 'Format question with context'
              }
            },
            {
              id: 'llm-1',
              type: 'OpenAI',
              position: { x: 800, y: 300 },
              data: {
                display_name: 'Answer Generator',
                description: 'Generate answers from context'
              }
            },
            {
              id: 'chat-output-1',
              type: 'ChatOutput',
              position: { x: 1050, y: 300 },
              data: {
                display_name: 'Answer Output',
                description: 'Display the answer'
              }
            }
          ],
          edges: [
            { id: 'e1', source: 'file-input-1', target: 'text-splitter-1' },
            { id: 'e2', source: 'text-splitter-1', target: 'embeddings-1' },
            { id: 'e3', source: 'embeddings-1', target: 'vector-store-1' },
            { id: 'e4', source: 'chat-input-1', target: 'retriever-1' },
            { id: 'e5', source: 'vector-store-1', target: 'retriever-1' },
            { id: 'e6', source: 'retriever-1', target: 'prompt-1' },
            { id: 'e7', source: 'chat-input-1', target: 'prompt-1' },
            { id: 'e8', source: 'prompt-1', target: 'llm-1' },
            { id: 'e9', source: 'llm-1', target: 'chat-output-1' }
          ],
          viewport: { x: 0, y: 0, zoom: 0.8 }
        },
        metadata: {
          created_with: 'Axie Studio',
          version: '1.0.0',
          author: 'Axie Studio Team',
          tags: ['rag', 'documents', 'qa', 'embeddings', 'intermediate'],
          estimated_time: '15 minutes',
          requirements: ['OpenAI API Key', 'Document files']
        },
        white_label_compatible: true
      },
      {
        id: 'axie-multi-agent-workflow',
        name: 'Axie Studio Multi-Agent Workflow',
        description: 'Coordinate multiple AI agents to solve complex tasks collaboratively.',
        category: 'Agents',
        difficulty: 'Advanced',
        data: {
          nodes: [
            {
              id: 'task-input-1',
              type: 'ChatInput',
              position: { x: 100, y: 200 },
              data: {
                display_name: 'Task Input',
                description: 'Define the complex task'
              }
            },
            {
              id: 'coordinator-1',
              type: 'Agent',
              position: { x: 350, y: 100 },
              data: {
                display_name: 'Coordinator Agent',
                description: 'Plans and coordinates the workflow'
              }
            },
            {
              id: 'researcher-1',
              type: 'Agent',
              position: { x: 600, y: 50 },
              data: {
                display_name: 'Research Agent',
                description: 'Gathers information and data'
              }
            },
            {
              id: 'analyst-1',
              type: 'Agent',
              position: { x: 600, y: 200 },
              data: {
                display_name: 'Analysis Agent',
                description: 'Analyzes data and findings'
              }
            },
            {
              id: 'writer-1',
              type: 'Agent',
              position: { x: 600, y: 350 },
              data: {
                display_name: 'Writer Agent',
                description: 'Creates final output'
              }
            },
            {
              id: 'output-1',
              type: 'ChatOutput',
              position: { x: 850, y: 200 },
              data: {
                display_name: 'Final Result',
                description: 'Collaborative agent output'
              }
            }
          ],
          edges: [
            { id: 'e1', source: 'task-input-1', target: 'coordinator-1' },
            { id: 'e2', source: 'coordinator-1', target: 'researcher-1' },
            { id: 'e3', source: 'coordinator-1', target: 'analyst-1' },
            { id: 'e4', source: 'coordinator-1', target: 'writer-1' },
            { id: 'e5', source: 'researcher-1', target: 'analyst-1' },
            { id: 'e6', source: 'analyst-1', target: 'writer-1' },
            { id: 'e7', source: 'writer-1', target: 'output-1' }
          ],
          viewport: { x: 0, y: 0, zoom: 0.9 }
        },
        metadata: {
          created_with: 'Axie Studio',
          version: '1.0.0',
          author: 'Axie Studio Team',
          tags: ['agents', 'multi-agent', 'workflow', 'collaboration', 'advanced'],
          estimated_time: '30 minutes',
          requirements: ['OpenAI API Key', 'Advanced AI understanding']
        },
        white_label_compatible: true,
        is_premium: true
      }
    ];
  }

  async getAllTemplates(): Promise<AxieStudioTemplate[]> {
    // Combine Axie Studio templates with rebranded Langflow templates
    try {
      const langflowResponse = await enhancedMiddleman.getTemplates();
      const langflowTemplates = langflowResponse.success ? langflowResponse.data : [];
      
      return [...this.templates, ...langflowTemplates];
    } catch (error) {
      console.warn('Failed to load external templates, using Axie Studio templates only');
      return this.templates;
    }
  }

  async getTemplatesByCategory(category: string): Promise<AxieStudioTemplate[]> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.filter(template => template.category === category);
  }

  async getTemplatesByDifficulty(difficulty: string): Promise<AxieStudioTemplate[]> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.filter(template => template.difficulty === difficulty);
  }

  async getTemplate(id: string): Promise<AxieStudioTemplate | null> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.find(template => template.id === id) || null;
  }

  async searchTemplates(query: string): Promise<AxieStudioTemplate[]> {
    const allTemplates = await this.getAllTemplates();
    const lowercaseQuery = query.toLowerCase();
    
    return allTemplates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async createFlowFromTemplate(templateId: string, customName?: string): Promise<any> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const flowData = {
      name: customName || `${template.name} - ${new Date().toLocaleDateString()}`,
      description: `Created from ${template.name} template`,
      data: template.data,
      is_component: false,
      metadata: {
        ...template.metadata,
        created_from_template: templateId,
        created_at: new Date().toISOString()
      }
    };

    return enhancedMiddleman.createFlow(flowData);
  }

  getTemplateCategories(): string[] {
    return ['Chat', 'RAG', 'Agents', 'Data Processing', 'Custom'];
  }

  getDifficultyLevels(): string[] {
    return ['Beginner', 'Intermediate', 'Advanced'];
  }
}

// Singleton instance
export const templateManager = new TemplateManager();