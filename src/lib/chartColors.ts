/**
 * Chart color utilities using design system colors
 * These colors are mapped to Tailwind CSS variables for theme consistency
 */

/**
 * Get chart colors array using CSS variables
 * These will automatically adapt to light/dark theme
 */
export const getChartColors = (): string[] => {
  return [
    'hsl(var(--chart-1))',  // Primary - #152a4c (light) / #4fd1c5 (dark)
    'hsl(var(--chart-2))',  // Secondary - #4fd1c5 (light) / #338cf5 (dark)
    'hsl(var(--chart-3))',  // Accent - #338cf5 (light) / #10b981 (dark)
    'hsl(var(--chart-4))',  // Success - #10b981
    'hsl(var(--chart-5))',  // Warning - #f59e0b (light) / Cyan variant (dark)
  ];
};

/**
 * Default chart colors array for direct use
 */
export const chartColors = getChartColors();

/**
 * Chart colors using design system accent colors
 * These are the primary colors from the design system
 */
export const designSystemChartColors = [
  'hsl(var(--primary))',     // #152a4c
  'hsl(var(--secondary))',   // #4fd1c5
  'hsl(var(--accent))',      // #338cf5
  'hsl(var(--success))',     // #10b981
  'hsl(var(--warning))',     // #f59e0b
];

/**
 * Get a single chart color by index
 */
export const getChartColor = (index: number): string => {
  const colors = getChartColors();
  return colors[index % colors.length];
};
