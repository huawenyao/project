import type { ThemeConfig } from 'antd';

/**
 * Ant Design主题配置
 * 支持深色/浅色主题切换
 */

// 浅色主题配置
export const lightTheme: ThemeConfig = {
  token: {
    // 主色调
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',

    // 文字颜色
    colorTextBase: '#000000',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',

    // 背景颜色
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f0f2f5',

    // 边框
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',

    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // 字体
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    // 间距
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
  },
  components: {
    Button: {
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },
    Input: {
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },
    Select: {
      controlHeight: 36,
    },
    Card: {
      borderRadiusLG: 8,
    },
    Modal: {
      borderRadiusLG: 8,
    },
  },
};

// 深色主题配置
export const darkTheme: ThemeConfig = {
  token: {
    // 主色调
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',

    // 文字颜色
    colorTextBase: '#ffffff',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',

    // 背景颜色
    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#000000',

    // 边框
    colorBorder: '#434343',
    colorBorderSecondary: '#303030',

    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // 字体
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    // 间距
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
  },
  components: {
    Button: {
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },
    Input: {
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },
    Select: {
      controlHeight: 36,
    },
    Card: {
      borderRadiusLG: 8,
    },
    Modal: {
      borderRadiusLG: 8,
    },
  },
  algorithm: (token) => ({
    ...token,
    // 深色算法会自动应用
  }),
};

// 主题类型
export type ThemeType = 'light' | 'dark';

// 默认导出浅色主题
export default lightTheme;
