import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { userRateLimit } from '../middleware/rateLimiter';

const router = Router();

// Apply user-specific rate limiting
router.use(userRateLimit(50, 60)); // 50 requests per minute per user

// Get available templates
router.get('/templates', asyncHandler(async (req, res) => {
  const { category, type } = req.query;

  // Mock templates data
  const templates = [
    {
      id: 'dashboard-template',
      name: 'Analytics Dashboard',
      description: 'Modern analytics dashboard with charts and metrics',
      category: 'dashboard',
      type: 'web',
      preview: 'https://example.com/preview/dashboard.png',
      components: ['chart', 'metric-card', 'table', 'filter'],
      features: ['real-time data', 'responsive design', 'dark mode'],
      difficulty: 'intermediate',
      estimatedTime: '2-3 hours'
    },
    {
      id: 'ecommerce-template',
      name: 'E-commerce Store',
      description: 'Complete online store with product catalog and checkout',
      category: 'ecommerce',
      type: 'web',
      preview: 'https://example.com/preview/ecommerce.png',
      components: ['product-grid', 'cart', 'checkout', 'user-auth'],
      features: ['payment integration', 'inventory management', 'order tracking'],
      difficulty: 'advanced',
      estimatedTime: '4-6 hours'
    },
    {
      id: 'blog-template',
      name: 'Personal Blog',
      description: 'Clean and minimal blog with CMS integration',
      category: 'blog',
      type: 'web',
      preview: 'https://example.com/preview/blog.png',
      components: ['post-list', 'post-detail', 'comments', 'search'],
      features: ['markdown support', 'SEO optimized', 'social sharing'],
      difficulty: 'beginner',
      estimatedTime: '1-2 hours'
    },
    {
      id: 'crm-template',
      name: 'Customer CRM',
      description: 'Customer relationship management system',
      category: 'business',
      type: 'web',
      preview: 'https://example.com/preview/crm.png',
      components: ['contact-list', 'deal-pipeline', 'calendar', 'reports'],
      features: ['contact management', 'sales pipeline', 'task tracking'],
      difficulty: 'advanced',
      estimatedTime: '5-8 hours'
    }
  ];

  let filteredTemplates = templates;

  if (category) {
    filteredTemplates = filteredTemplates.filter(t => t.category === category);
  }

  if (type) {
    filteredTemplates = filteredTemplates.filter(t => t.type === type);
  }

  res.json({
    success: true,
    data: {
      templates: filteredTemplates,
      count: filteredTemplates.length,
      categories: ['dashboard', 'ecommerce', 'blog', 'business'],
      types: ['web', 'mobile', 'desktop']
    }
  });
}));

// Get specific template
router.get('/templates/:templateId', asyncHandler(async (req, res) => {
  const { templateId } = req.params;

  // Mock template details
  const templateDetails = {
    id: templateId,
    name: 'Analytics Dashboard',
    description: 'Modern analytics dashboard with charts and metrics',
    category: 'dashboard',
    type: 'web',
    preview: 'https://example.com/preview/dashboard.png',
    components: [
      {
        id: 'header',
        type: 'navigation',
        name: 'Header Navigation',
        required: true,
        configuration: {
          logo: true,
          menu: ['Dashboard', 'Analytics', 'Reports', 'Settings'],
          userMenu: true
        }
      },
      {
        id: 'metrics',
        type: 'metric-cards',
        name: 'Key Metrics',
        required: true,
        configuration: {
          metrics: ['Total Users', 'Revenue', 'Conversion Rate', 'Growth'],
          layout: 'grid',
          animations: true
        }
      },
      {
        id: 'chart',
        type: 'line-chart',
        name: 'Trend Chart',
        required: false,
        configuration: {
          dataSource: 'analytics',
          timeRange: '30d',
          responsive: true
        }
      }
    ],
    features: ['real-time data', 'responsive design', 'dark mode'],
    difficulty: 'intermediate',
    estimatedTime: '2-3 hours',
    requirements: {
      frontend: ['React', 'TypeScript', 'Tailwind CSS'],
      backend: ['Node.js', 'Express', 'PostgreSQL'],
      integrations: ['Analytics API', 'Authentication']
    },
    setup: {
      steps: [
        'Clone template repository',
        'Install dependencies',
        'Configure environment variables',
        'Set up database',
        'Run development server'
      ],
      commands: [
        'npm install',
        'cp .env.example .env',
        'npm run db:migrate',
        'npm run dev'
      ]
    }
  };

  res.json({
    success: true,
    data: templateDetails
  });
}));

// Get available components
router.get('/components', asyncHandler(async (req, res) => {
  const { category, framework } = req.query;

  // Mock components data
  const components = [
    {
      id: 'button',
      name: 'Button',
      description: 'Customizable button component with variants',
      category: 'form',
      framework: 'react',
      props: [
        { name: 'variant', type: 'string', options: ['primary', 'secondary', 'outline'] },
        { name: 'size', type: 'string', options: ['sm', 'md', 'lg'] },
        { name: 'disabled', type: 'boolean' },
        { name: 'onClick', type: 'function' }
      ],
      preview: 'https://example.com/components/button.png',
      code: 'export const Button = ({ variant, size, children, ...props }) => { ... }'
    },
    {
      id: 'data-table',
      name: 'Data Table',
      description: 'Advanced data table with sorting, filtering, and pagination',
      category: 'data',
      framework: 'react',
      props: [
        { name: 'data', type: 'array', required: true },
        { name: 'columns', type: 'array', required: true },
        { name: 'sortable', type: 'boolean' },
        { name: 'filterable', type: 'boolean' },
        { name: 'pagination', type: 'boolean' }
      ],
      preview: 'https://example.com/components/data-table.png',
      code: 'export const DataTable = ({ data, columns, ...props }) => { ... }'
    },
    {
      id: 'chart',
      name: 'Chart',
      description: 'Responsive chart component with multiple chart types',
      category: 'visualization',
      framework: 'react',
      props: [
        { name: 'type', type: 'string', options: ['line', 'bar', 'pie', 'area'] },
        { name: 'data', type: 'array', required: true },
        { name: 'responsive', type: 'boolean' },
        { name: 'theme', type: 'string', options: ['light', 'dark'] }
      ],
      preview: 'https://example.com/components/chart.png',
      code: 'export const Chart = ({ type, data, ...props }) => { ... }'
    }
  ];

  let filteredComponents = components;

  if (category) {
    filteredComponents = filteredComponents.filter(c => c.category === category);
  }

  if (framework) {
    filteredComponents = filteredComponents.filter(c => c.framework === framework);
  }

  res.json({
    success: true,
    data: {
      components: filteredComponents,
      count: filteredComponents.length,
      categories: ['form', 'data', 'visualization', 'layout', 'navigation'],
      frameworks: ['react', 'vue', 'angular', 'svelte']
    }
  });
}));

// Get specific component
router.get('/components/:componentId', asyncHandler(async (req, res) => {
  const { componentId } = req.params;

  // Mock component details
  const componentDetails = {
    id: componentId,
    name: 'Data Table',
    description: 'Advanced data table with sorting, filtering, and pagination',
    category: 'data',
    framework: 'react',
    version: '1.2.0',
    author: 'AI Agent Builder',
    license: 'MIT',
    props: [
      {
        name: 'data',
        type: 'array',
        required: true,
        description: 'Array of data objects to display',
        example: '[{ id: 1, name: "John", email: "john@example.com" }]'
      },
      {
        name: 'columns',
        type: 'array',
        required: true,
        description: 'Column configuration array',
        example: '[{ key: "name", label: "Name", sortable: true }]'
      },
      {
        name: 'sortable',
        type: 'boolean',
        default: true,
        description: 'Enable column sorting'
      },
      {
        name: 'filterable',
        type: 'boolean',
        default: false,
        description: 'Enable column filtering'
      }
    ],
    dependencies: ['react', 'react-table', 'styled-components'],
    preview: 'https://example.com/components/data-table.png',
    code: `
import React from 'react';
import { useTable, useSortBy, useFilters, usePagination } from 'react-table';

export const DataTable = ({ 
  data, 
  columns, 
  sortable = true, 
  filterable = false,
  pagination = true 
}) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 }
    },
    useFilters,
    useSortBy,
    usePagination
  );

  return (
    <div className="data-table">
      <table {...getTableProps()} className="table">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th
                  {...column.getHeaderProps(
                    sortable ? column.getSortByToggleProps() : {}
                  )}
                  className="table-header"
                >
                  {column.render('Header')}
                  {sortable && (
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? ' 🔽'
                          : ' 🔼'
                        : ''}
                    </span>
                  )}
                  {filterable && column.canFilter ? (
                    <div>{column.render('Filter')}</div>
                  ) : null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()} className="table-cell">
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {pagination && (
        <div className="pagination">
          <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
            {'<<'}
          </button>
          <button onClick={() => previousPage()} disabled={!canPreviousPage}>
            {'<'}
          </button>
          <button onClick={() => nextPage()} disabled={!canNextPage}>
            {'>'}
          </button>
          <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
            {'>>'}
          </button>
          <span>
            Page{' '}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{' '}
          </span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
    `,
    usage: `
import { DataTable } from './components/DataTable';

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
];

const columns = [
  { Header: 'Name', accessor: 'name' },
  { Header: 'Email', accessor: 'email' },
  { Header: 'Role', accessor: 'role' }
];

function App() {
  return (
    <DataTable 
      data={data} 
      columns={columns} 
      sortable={true}
      filterable={true}
      pagination={true}
    />
  );
}
    `
  };

  res.json({
    success: true,
    data: componentDetails
  });
}));

// Get design themes
router.get('/themes', asyncHandler(async (req, res) => {
  const themes = [
    {
      id: 'modern-light',
      name: 'Modern Light',
      description: 'Clean and minimal light theme',
      preview: 'https://example.com/themes/modern-light.png',
      colors: {
        primary: '#3B82F6',
        secondary: '#64748B',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text: '#1E293B'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        headingWeight: '600',
        bodyWeight: '400'
      },
      spacing: {
        unit: '4px',
        scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64]
      }
    },
    {
      id: 'dark-professional',
      name: 'Dark Professional',
      description: 'Sophisticated dark theme for professional apps',
      preview: 'https://example.com/themes/dark-professional.png',
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#10B981',
        background: '#0F172A',
        surface: '#1E293B',
        text: '#F1F5F9'
      },
      typography: {
        fontFamily: 'Roboto, sans-serif',
        headingWeight: '500',
        bodyWeight: '400'
      },
      spacing: {
        unit: '4px',
        scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64]
      }
    }
  ];

  res.json({
    success: true,
    data: {
      themes,
      count: themes.length
    }
  });
}));

// Validate app configuration
router.post('/validate', asyncHandler(async (req, res) => {
  const { configuration } = req.body;

  if (!configuration) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Configuration is required',
        code: 'MISSING_CONFIGURATION'
      }
    });
  }

  // Mock validation logic
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!configuration.name) {
    errors.push({
      field: 'name',
      message: 'App name is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!configuration.components || configuration.components.length === 0) {
    warnings.push({
      field: 'components',
      message: 'No components defined',
      code: 'EMPTY_COMPONENTS'
    });
  }

  // Check component configurations
  if (configuration.components) {
    configuration.components.forEach((component, index) => {
      if (!component.type) {
        errors.push({
          field: `components[${index}].type`,
          message: 'Component type is required',
          code: 'REQUIRED_FIELD'
        });
      }
    });
  }

  const isValid = errors.length === 0;

  res.json({
    success: true,
    data: {
      valid: isValid,
      errors,
      warnings,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        componentsCount: configuration.components?.length || 0
      }
    }
  });
}));

// Generate app preview
router.post('/preview', asyncHandler(async (req, res) => {
  const { configuration } = req.body;

  if (!configuration) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Configuration is required',
        code: 'MISSING_CONFIGURATION'
      }
    });
  }

  // Mock preview generation
  const preview = {
    id: `preview_${Date.now()}`,
    url: `https://preview.example.com/${Date.now()}`,
    status: 'generating',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    screenshots: {
      desktop: `https://preview.example.com/${Date.now()}/desktop.png`,
      tablet: `https://preview.example.com/${Date.now()}/tablet.png`,
      mobile: `https://preview.example.com/${Date.now()}/mobile.png`
    }
  };

  // Simulate preview generation
  setTimeout(() => {
    preview.status = 'ready';
  }, 3000);

  res.status(202).json({
    success: true,
    data: preview
  });
}));

export default router;