#!/usr/bin/env node

/**
 * iOS 26 Design System Validator
 * Ensures compliance with iOS Human Interface Guidelines
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

class iOSDesignValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.passed = [];

    // iOS 26 Design Standards
    this.standards = {
      colors: {
        primary: [
          '#007AFF',
          '#5856D6',
          '#AF52DE',
          '#FF2D92',
          '#FF3B30',
          '#FF9500',
          '#FFCC00',
          '#34C759',
          '#00C7BE',
          '#30B0C7',
        ],
        semantic: ['success', 'warning', 'error', 'info'],
        adaptive: ['light', 'dark', 'system'],
      },
      typography: {
        sizes: [11, 12, 13, 15, 17, 20, 24, 28, 34, 48],
        weights: [
          'ultralight',
          'thin',
          'light',
          'regular',
          'medium',
          'semibold',
          'bold',
          'heavy',
          'black',
        ],
        families: [
          'SF Pro',
          'SF Pro Display',
          'SF Compact',
          'system-ui',
          '-apple-system',
        ],
      },
      spacing: {
        values: [4, 8, 12, 16, 20, 24, 32, 44, 48, 64, 88],
        padding: [8, 16, 20, 24],
        margins: [16, 20, 24, 32],
      },
      accessibility: {
        minTouchTarget: 44, // pixels
        minContrastRatio: 4.5,
        maxTextLength: 75, // characters per line
      },
      animation: {
        durations: [0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 1.0],
        easings: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'cubic-bezier'],
      },
    };
  }

  async validateColorSystem() {
    console.log('🎨 Validating color system...');

    try {
      const themeConfigPath = join(projectRoot, 'src/utils/themeConfig.ts');
      if (!existsSync(themeConfigPath)) {
        this.violations.push('Missing themeConfig.ts file');
        return;
      }

      const themeConfig = readFileSync(themeConfigPath, 'utf8');

      // Check for adaptive theming
      if (
        !themeConfig.includes('lightTheme') ||
        !themeConfig.includes('darkTheme')
      ) {
        this.violations.push('Missing adaptive theme definitions (light/dark)');
      } else {
        this.passed.push('Adaptive theming implemented');
      }

      // Check for semantic color names
      const semanticColors = [
        'primary',
        'secondary',
        'background',
        'surface',
        'error',
        'warning',
        'success',
      ];
      const missingSemanticColors = semanticColors.filter(
        color => !themeConfig.includes(color)
      );

      if (missingSemanticColors.length > 0) {
        this.violations.push(
          `Missing semantic colors: ${missingSemanticColors.join(', ')}`
        );
      } else {
        this.passed.push('Semantic color system implemented');
      }

      // Check for iOS-standard color values
      const hasSystemColors = this.standards.colors.primary.some(color =>
        themeConfig.includes(color)
      );
      if (!hasSystemColors) {
        this.warnings.push(
          'Consider using iOS system colors for better platform consistency'
        );
      } else {
        this.passed.push('iOS system colors detected');
      }
    } catch (error) {
      this.violations.push(`Color system validation failed: ${error.message}`);
    }
  }

  async validateTypography() {
    console.log('📝 Validating typography system...');

    try {
      // Check CSS files for typography
      const cssFiles = await glob('src/**/*.css', { cwd: projectRoot });
      let typographySystem = '';

      for (const file of cssFiles) {
        const content = readFileSync(join(projectRoot, file), 'utf8');
        typographySystem += content;
      }

      // Check for iOS font families
      const hasSFPro =
        typographySystem.includes('SF Pro') ||
        typographySystem.includes('-apple-system');
      if (!hasSFPro) {
        this.violations.push(
          'Missing iOS-standard font families (SF Pro, -apple-system)'
        );
      } else {
        this.passed.push('iOS font families implemented');
      }

      // Check for responsive typography
      const hasFluidTypography =
        typographySystem.includes('clamp(') || typographySystem.includes('vw');
      if (!hasFluidTypography) {
        this.warnings.push(
          'Consider implementing fluid typography for better responsiveness'
        );
      } else {
        this.passed.push('Responsive typography detected');
      }

      // Check for semantic text styles
      const textStyles = ['headline', 'title', 'body', 'caption', 'footnote'];
      const hasSemanticStyles = textStyles.some(style =>
        typographySystem.includes(style)
      );

      if (!hasSemanticStyles) {
        this.warnings.push(
          'Consider implementing semantic text styles (headline, title, body, etc.)'
        );
      } else {
        this.passed.push('Semantic text styles detected');
      }
    } catch (error) {
      this.violations.push(`Typography validation failed: ${error.message}`);
    }
  }

  async validateSpacing() {
    console.log('📏 Validating spacing system...');

    try {
      const cssFiles = await glob('src/**/*.css', { cwd: projectRoot });
      let allCSS = '';

      for (const file of cssFiles) {
        const content = readFileSync(join(projectRoot, file), 'utf8');
        allCSS += content;
      }

      // Extract spacing values
      const spacingRegex =
        /(?:padding|margin|gap|top|right|bottom|left|width|height):\s*(\d+)px/g;
      const spacingValues = [];
      let match;

      while ((match = spacingRegex.exec(allCSS)) !== null) {
        spacingValues.push(parseInt(match[1]));
      }

      const uniqueSpacing = [...new Set(spacingValues)].sort((a, b) => a - b);

      // Check for 8px grid system
      const follows8pxGrid = uniqueSpacing.every(value => value % 4 === 0);
      if (!follows8pxGrid) {
        const violations = uniqueSpacing.filter(value => value % 4 !== 0);
        this.warnings.push(
          `Spacing values not following 4px grid: ${violations.join(', ')}px`
        );
      } else {
        this.passed.push('Spacing follows 4px grid system');
      }

      // Check for excessive spacing variety
      if (uniqueSpacing.length > 20) {
        this.warnings.push(
          `Too many spacing values (${uniqueSpacing.length}). Consider standardizing.`
        );
      } else {
        this.passed.push('Spacing system is well-constrained');
      }
    } catch (error) {
      this.violations.push(`Spacing validation failed: ${error.message}`);
    }
  }

  async validateAccessibility() {
    console.log('♿ Validating accessibility compliance...');

    try {
      // Check TypeScript/JSX files for accessibility attributes
      const tsxFiles = await glob('src/**/*.{ts,tsx}', { cwd: projectRoot });
      let accessibilityScore = 0;
      let totalInteractiveElements = 0;

      for (const file of tsxFiles) {
        const content = readFileSync(join(projectRoot, file), 'utf8');

        // Count interactive elements
        const buttons = (
          content.match(/<button|<input|<select|<textarea/g) || []
        ).length;
        const customInteractive = (
          content.match(/role="button"|onClick=/g) || []
        ).length;
        totalInteractiveElements += buttons + customInteractive;

        // Count accessibility attributes
        const ariaLabels = (content.match(/aria-label=/g) || []).length;
        const ariaDescribedBy = (content.match(/aria-describedby=/g) || [])
          .length;
        const roles = (content.match(/role=/g) || []).length;
        const tabIndexes = (content.match(/tabIndex=/g) || []).length;

        accessibilityScore += ariaLabels + ariaDescribedBy + roles + tabIndexes;
      }

      const accessibilityRatio =
        totalInteractiveElements > 0
          ? accessibilityScore / totalInteractiveElements
          : 1;

      if (accessibilityRatio < 0.5) {
        this.violations.push(
          `Low accessibility compliance: ${Math.round(accessibilityRatio * 100)}% of interactive elements have accessibility attributes`
        );
      } else if (accessibilityRatio < 0.8) {
        this.warnings.push(
          `Moderate accessibility compliance: ${Math.round(accessibilityRatio * 100)}% of interactive elements have accessibility attributes`
        );
      } else {
        this.passed.push(
          `High accessibility compliance: ${Math.round(accessibilityRatio * 100)}% of interactive elements have accessibility attributes`
        );
      }

      // Check for semantic HTML
      const componentFiles = await glob('src/components/**/*.{ts,tsx}', {
        cwd: projectRoot,
      });
      let semanticScore = 0;

      for (const file of componentFiles) {
        const content = readFileSync(join(projectRoot, file), 'utf8');

        const semanticElements = (
          content.match(
            /<(nav|main|section|article|aside|header|footer|button)/g
          ) || []
        ).length;
        const genericDivs = (content.match(/<div/g) || []).length;

        if (genericDivs > 0) {
          semanticScore += semanticElements / (semanticElements + genericDivs);
        }
      }

      const avgSemanticScore = semanticScore / componentFiles.length;

      if (avgSemanticScore < 0.3) {
        this.warnings.push(
          'Low semantic HTML usage. Consider using more semantic elements.'
        );
      } else {
        this.passed.push('Good semantic HTML structure detected');
      }
    } catch (error) {
      this.violations.push(`Accessibility validation failed: ${error.message}`);
    }
  }

  async validateAnimations() {
    console.log('🎬 Validating animation system...');

    try {
      const cssFiles = await glob('src/**/*.css', { cwd: projectRoot });
      let animationCSS = '';

      for (const file of cssFiles) {
        const content = readFileSync(join(projectRoot, file), 'utf8');
        animationCSS += content;
      }

      // Check for iOS-standard animation durations
      const durationRegex =
        /(?:transition-duration|animation-duration):\s*([0-9.]+)s/g;
      const durations = [];
      let match;

      while ((match = durationRegex.exec(animationCSS)) !== null) {
        durations.push(parseFloat(match[1]));
      }

      const nonStandardDurations = durations.filter(
        d => !this.standards.animation.durations.includes(d)
      );

      if (nonStandardDurations.length > 0) {
        this.warnings.push(
          `Non-standard animation durations detected: ${nonStandardDurations.join('s, ')}s`
        );
      } else if (durations.length > 0) {
        this.passed.push('Animation durations follow iOS standards');
      }

      // Check for proper easing functions
      const easingRegex =
        /(?:transition-timing-function|animation-timing-function):\s*([^;]+)/g;
      const easings = [];

      while ((match = easingRegex.exec(animationCSS)) !== null) {
        easings.push(match[1].trim());
      }

      const hasProperEasing = easings.some(easing =>
        this.standards.animation.easings.some(standard =>
          easing.includes(standard)
        )
      );

      if (easings.length > 0 && !hasProperEasing) {
        this.warnings.push('Consider using iOS-standard easing functions');
      } else if (hasProperEasing) {
        this.passed.push('iOS-standard easing functions detected');
      }

      // Check for reduced motion support
      const hasReducedMotion = animationCSS.includes(
        '@media (prefers-reduced-motion'
      );
      if (!hasReducedMotion) {
        this.violations.push(
          'Missing reduced motion support (@media (prefers-reduced-motion))'
        );
      } else {
        this.passed.push('Reduced motion accessibility implemented');
      }
    } catch (error) {
      this.violations.push(`Animation validation failed: ${error.message}`);
    }
  }

  async validateComponentStructure() {
    console.log('🧩 Validating component structure...');

    try {
      const componentFiles = await glob('src/components/**/*.{ts,tsx}', {
        cwd: projectRoot,
      });

      if (componentFiles.length === 0) {
        this.violations.push('No component files found');
        return;
      }

      let properlyStructuredComponents = 0;

      for (const file of componentFiles) {
        const content = readFileSync(join(projectRoot, file), 'utf8');

        // Check for TypeScript interfaces/types
        const hasTypes =
          content.includes('interface ') || content.includes('type ');

        // Check for proper exports
        const hasDefaultExport = content.includes('export default');

        // Check for component naming
        const fileName = file
          .split('/')
          .pop()
          .replace('.tsx', '')
          .replace('.ts', '');
        const hasMatchingComponentName =
          content.includes(`function ${fileName}`) ||
          content.includes(`const ${fileName}`) ||
          content.includes(`export { ${fileName}`) ||
          content.includes(`export default ${fileName}`);

        if (hasTypes && hasDefaultExport && hasMatchingComponentName) {
          properlyStructuredComponents++;
        }
      }

      const structureScore =
        properlyStructuredComponents / componentFiles.length;

      if (structureScore < 0.7) {
        this.warnings.push(
          `${Math.round(structureScore * 100)}% of components follow proper structure conventions`
        );
      } else {
        this.passed.push(
          `${Math.round(structureScore * 100)}% of components follow proper structure conventions`
        );
      }
    } catch (error) {
      this.violations.push(
        `Component structure validation failed: ${error.message}`
      );
    }
  }

  printResults() {
    console.log('\n📊 iOS DESIGN SYSTEM VALIDATION RESULTS\n');

    if (this.passed.length > 0) {
      console.log('✅ PASSED CHECKS:');
      this.passed.forEach(check => console.log(`   ✅ ${check}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`   ⚠️ ${warning}`));
      console.log('');
    }

    if (this.violations.length > 0) {
      console.log('❌ VIOLATIONS:');
      this.violations.forEach(violation => console.log(`   ❌ ${violation}`));
      console.log('');
    }

    const totalChecks =
      this.passed.length + this.warnings.length + this.violations.length;
    const passRate = Math.round((this.passed.length / totalChecks) * 100);

    console.log(`📈 Design System Compliance: ${passRate}%`);
    console.log(
      `🎯 Passed: ${this.passed.length}, Warnings: ${this.warnings.length}, Violations: ${this.violations.length}\n`
    );

    if (this.violations.length > 0 || this.warnings.length > 2) {
      console.log('💡 RECOMMENDATIONS:');
      if (this.violations.length > 0) {
        console.log('   - Address critical violations first');
      }
      if (this.warnings.length > 2) {
        console.log('   - Review warnings for iOS compliance improvements');
      }
      console.log('   - Refer to iOS Human Interface Guidelines');
      console.log('   - Run: npm run design:fix\n');
    }
  }

  async run() {
    console.log('📱 iOS 26 Design System Validation Starting...\n');

    await this.validateColorSystem();
    await this.validateTypography();
    await this.validateSpacing();
    await this.validateAccessibility();
    await this.validateAnimations();
    await this.validateComponentStructure();

    this.printResults();

    process.exit(this.violations.length > 0 ? 1 : 0);
  }
}

// Run validation if called directly
if (
  import.meta.url.startsWith('file:') &&
  process.argv[1] &&
  import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))
) {
  const validator = new iOSDesignValidator();
  validator.run().catch(console.error);
}

export { iOSDesignValidator };
