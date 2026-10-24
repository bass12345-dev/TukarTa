import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';

interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Lightweight vector QR matrix generator
 * Creates a deterministic, valid-looking high contrast matrix with corner finder patterns
 */
export function QRCodeView({
  value,
  size = 180,
  color = '#10B981',
  backgroundColor = '#FFFFFF',
}: QRCodeViewProps) {
  const gridSize = 21; // standard version 1 QR grid size

  // Generate deterministic binary pattern from value string
  const matrix = useMemo(() => {
    const grid: boolean[][] = Array(gridSize)
      .fill(false)
      .map(() => Array(gridSize).fill(false));

    // 1. Draw 3 corner finder patterns (7x7 with inner 3x3)
    const drawFinderPattern = (startX: number, startY: number) => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const isOuterBorder = x === 0 || x === 6 || y === 0 || y === 6;
          const isInnerSquare = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          grid[startY + y][startX + x] = isOuterBorder || isInnerSquare;
        }
      }
    };

    drawFinderPattern(0, 0); // Top-left
    drawFinderPattern(gridSize - 7, 0); // Top-right
    drawFinderPattern(0, gridSize - 7); // Bottom-left

    // 2. Timing patterns (alternating dots between finders)
    for (let i = 8; i < gridSize - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // 3. Populate deterministic modules from string characters hash
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }

    let seed = Math.abs(hash) || 12345;
    const lcg = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        // Skip finder areas
        const inTopLeft = x < 8 && y < 8;
        const inTopRight = x >= gridSize - 8 && y < 8;
        const inBottomLeft = x < 8 && y >= gridSize - 8;
        const inTiming = (y === 6 && x >= 8 && x < gridSize - 8) || (x === 6 && y >= 8 && y < gridSize - 8);

        if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
          // Semi-dense QR fill
          grid[y][x] = lcg() > 0.48;
        }
      }
    }

    return grid;
  }, [value]);

  const moduleSize = size / gridSize;

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Svg width={size} height={size}>
        <G>
          {matrix.map((row, y) =>
            row.map((isFilled, x) =>
              isFilled ? (
                <Rect
                  key={`${x}-${y}`}
                  x={x * moduleSize}
                  y={y * moduleSize}
                  width={moduleSize - 0.2}
                  height={moduleSize - 0.2}
                  fill={color}
                  rx={0.5}
                />
              ) : null
            )
          )}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
