import { BaseAgent, AgentCapability, AgentExecutionContext, AgentExecutionResult } from './BaseAgent';
import { AIService } from '../services/AIService';

export class UIAgent extends BaseAgent {
  constructor(aiService: AIService) {
    super(aiService, 'ui');
  }

  protected initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'create_interface',
        description: 'Create a complete user interface based on requirements',
        parameters: [
          { name: 'appType', type: 'string', required: true },
          { name: 'features', type: 'array', required: true },
          { name: 'framework', type: 'string', required: false, default: 'react' },
          { name: 'styling', type: 'string', required: false, default: 'tailwind' }
        ],
        examples: ['Create a dashboard interface', 'Build an e-commerce product page']
      },
      {
        name: 'create_component',
        description: 'Generate a specific UI component',
        parameters: [
          { name: 'componentType', type: 'string', required: true },
          { name: 'props', type: 'object', required: false },
          { name: 'framework', type: 'string', required: false, default: 'react' }
        ],
        examples: ['Create a data table component', 'Build a form validation component']
      },
      {
        name: 'modify_interface',
        description: 'Modify existing interface elements',
        parameters: [
          { name: 'targetElement', type: 'string', required: true },
          { name: 'modifications', type: 'array', required: true },
          { name: 'preserveData', type: 'boolean', required: false, default: true }
        ],
        examples: ['Add a new section to dashboard', 'Update form layout']
      },
      {
        name: 'optimize_layout',
        description: 'Optimize interface layout for better UX',
        parameters: [
          { name: 'currentLayout', type: 'object', required: true },
          { name: 'targetDevices', type: 'array', required: false },
          { name: 'priorities', type: 'array', required: false }
        ],
        examples: ['Make layout mobile-responsive', 'Improve accessibility']
      },
      {
        name: 'generate_theme',
        description: 'Create a consistent design theme',
        parameters: [
          { name: 'brandColors', type: 'object', required: false },
          { name: 'style', type: 'string', required: false },
          { name: 'components', type: 'array', required: true }
        ],
        examples: ['Create a modern dark theme', 'Generate corporate brand theme']
      }
    ];
  }

  public async execute(
    action: string,
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    this.startExecution();
    
    try {
      this.validateParameters(action, parameters);
      this.logInfo(`Executing ${action}`, parameters);

      let result: AgentExecutionResult;

      switch (action) {
        case 'create_interface':
          result = await this.createInterface(parameters, context);
          break;
        case 'create_component':
          result = await this.createComponent(parameters, context);
          break;
        case 'modify_interface':
          result = await this.modifyInterface(parameters, context);
          break;
        case 'optimize_layout':
          result = await this.optimizeLayout(parameters, context);
          break;
        case 'generate_theme':
          result = await this.generateTheme(parameters, context);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      this.logInfo(`Successfully completed ${action}`);
      return result;

    } catch (error) {
      this.logError(`Failed to execute ${action}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.endExecution();
    }
  }

  private async createInterface(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { appType, features, framework = 'react', styling = 'tailwind' } = parameters;

    const prompt = `Create a complete ${appType} interface with the following features:
${features.map((f: string) => `- ${f}`).join('\n')}

Framework: ${framework}
Styling: ${styling}

Requirements:
- Modern, responsive design
- Accessible components
- Clean, maintainable code structure
- Proper component hierarchy
- State management where needed
- Error handling and loading states

Generate:
1. Main application component
2. Individual feature components
3. Shared/common components
4. Styling/theme configuration
5. Component documentation

Return the result as a JSON object with components, styles, and documentation.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.6,
        maxTokens: 4000
      });

      // Parse the AI response
      const interfaceData = this.parseInterfaceResponse(response);
      
      const artifacts = [
        this.createArtifact('interface', 'main_interface', interfaceData.components),
        this.createArtifact('styles', 'theme_config', interfaceData.styles),
        this.createArtifact('documentation', 'component_docs', interfaceData.documentation)
      ];

      return {
        success: true,
        data: interfaceData,
        artifacts,
        nextSteps: [
          'Review generated components',
          'Test responsive behavior',
          'Integrate with backend APIs',
          'Add custom styling if needed'
        ],
        metadata: {
          framework,
          styling,
          componentCount: Object.keys(interfaceData.components).length
        }
      };

    } catch (error) {
      throw new Error(`Interface creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createComponent(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { componentType, props = {}, framework = 'react' } = parameters;

    try {
      const componentData = await this.aiService.generateComponentCode(
        componentType,
        Object.keys(props),
        framework
      );

      const artifact = this.createArtifact(
        'component',
        componentType.toLowerCase().replace(/\s+/g, '_'),
        componentData.code,
        {
          dependencies: componentData.dependencies,
          props: componentData.props,
          framework
        }
      );

      return {
        success: true,
        data: componentData,
        artifacts: [artifact],
        nextSteps: [
          'Install required dependencies',
          'Import component in parent',
          'Test component functionality',
          'Add custom styling if needed'
        ],
        metadata: {
          framework,
          dependencies: componentData.dependencies.length,
          propsCount: componentData.props.length
        }
      };

    } catch (error) {
      throw new Error(`Component creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async modifyInterface(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { targetElement, modifications, preserveData = true } = parameters;

    const prompt = `Modify the following interface element: ${targetElement}

Requested modifications:
${modifications.map((m: string) => `- ${m}`).join('\n')}

Preserve existing data: ${preserveData}

Current context: ${JSON.stringify(context.workspace, null, 2)}

Generate:
1. Updated component code
2. Migration steps if data structure changes
3. Updated documentation
4. Testing recommendations

Ensure backward compatibility and smooth user experience during the transition.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 3000
      });

      const modificationData = this.parseModificationResponse(response);
      
      const artifacts = [
        this.createArtifact('modified_component', targetElement, modificationData.updatedCode),
        this.createArtifact('migration_guide', 'migration_steps', modificationData.migrationSteps)
      ];

      return {
        success: true,
        data: modificationData,
        artifacts,
        nextSteps: modificationData.nextSteps || [
          'Review modified component',
          'Test existing functionality',
          'Deploy changes gradually'
        ],
        metadata: {
          targetElement,
          modificationsCount: modifications.length,
          preserveData
        }
      };

    } catch (error) {
      throw new Error(`Interface modification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async optimizeLayout(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { currentLayout, targetDevices = ['desktop', 'tablet', 'mobile'], priorities = ['performance', 'accessibility'] } = parameters;

    const prompt = `Optimize this layout for better user experience:

Current Layout: ${JSON.stringify(currentLayout, null, 2)}

Target Devices: ${targetDevices.join(', ')}
Optimization Priorities: ${priorities.join(', ')}

Provide:
1. Optimized layout structure
2. Responsive breakpoints
3. Performance improvements
4. Accessibility enhancements
5. CSS/styling updates

Focus on modern best practices and user experience principles.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.5,
        maxTokens: 3500
      });

      const optimizationData = this.parseOptimizationResponse(response);
      
      const artifacts = [
        this.createArtifact('optimized_layout', 'layout_structure', optimizationData.layout),
        this.createArtifact('responsive_styles', 'breakpoints', optimizationData.styles),
        this.createArtifact('optimization_report', 'improvements', optimizationData.improvements)
      ];

      return {
        success: true,
        data: optimizationData,
        artifacts,
        nextSteps: [
          'Test layout on target devices',
          'Validate accessibility improvements',
          'Measure performance gains',
          'Gather user feedback'
        ],
        metadata: {
          targetDevices,
          priorities,
          improvementsCount: optimizationData.improvements?.length || 0
        }
      };

    } catch (error) {
      throw new Error(`Layout optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateTheme(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { brandColors = {}, style = 'modern', components } = parameters;

    const prompt = `Generate a comprehensive design theme:

Brand Colors: ${JSON.stringify(brandColors, null, 2)}
Style: ${style}
Components to theme: ${components.join(', ')}

Create:
1. Complete color palette (primary, secondary, neutral, semantic colors)
2. Typography scale and font selections
3. Spacing and sizing system
4. Component-specific styling
5. Dark/light mode variants
6. CSS custom properties/variables

Ensure consistency, accessibility (WCAG compliance), and modern design principles.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.6,
        maxTokens: 4000
      });

      const themeData = this.parseThemeResponse(response);
      
      const artifacts = [
        this.createArtifact('theme_config', 'design_system', themeData.theme),
        this.createArtifact('css_variables', 'custom_properties', themeData.cssVariables),
        this.createArtifact('component_themes', 'styled_components', themeData.componentStyles)
      ];

      return {
        success: true,
        data: themeData,
        artifacts,
        nextSteps: [
          'Apply theme to components',
          'Test color contrast ratios',
          'Validate dark mode appearance',
          'Create theme documentation'
        ],
        metadata: {
          style,
          componentsCount: components.length,
          hasCustomColors: Object.keys(brandColors).length > 0
        }
      };

    } catch (error) {
      throw new Error(`Theme generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseInterfaceResponse(response: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: create structured response from text
      return {
        components: { main: response },
        styles: {},
        documentation: 'Generated interface components'
      };
    } catch (error) {
      this.logWarn('Failed to parse interface response, using fallback');
      return {
        components: { main: response },
        styles: {},
        documentation: 'Generated interface components'
      };
    }
  }

  private parseModificationResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        updatedCode: response,
        migrationSteps: [],
        nextSteps: []
      };
    } catch (error) {
      return {
        updatedCode: response,
        migrationSteps: [],
        nextSteps: []
      };
    }
  }

  private parseOptimizationResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        layout: response,
        styles: {},
        improvements: []
      };
    } catch (error) {
      return {
        layout: response,
        styles: {},
        improvements: []
      };
    }
  }

  private parseThemeResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        theme: response,
        cssVariables: {},
        componentStyles: {}
      };
    } catch (error) {
      return {
        theme: response,
        cssVariables: {},
        componentStyles: {}
      };
    }
  }
}