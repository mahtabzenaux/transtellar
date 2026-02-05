import React from 'react';
import { Svg, Path, Circle, Polyline, Line, Rect } from 'react-native-svg';
import { THEME } from '../theme/theme';
import { StyleProp, ViewStyle } from 'react-native';

export type IconName =
    | 'wallet'
    | 'arrow-left'
    | 'arrow-right'
    | 'arrow-up-right'
    | 'copy'
    | 'history'
    | 'settings'
    | 'check'
    | 'close'
    | 'plus'
    | 'shield'
    | 'refresh'
    | 'eye'
    | 'eye-off'
    | 'network'
    | 'qrc'
    | 'send'
    | 'receive'
    | 'backspace'
    | 'lock'
    | 'trash'
    | 'search'
    | 'arrow-down-left'
    | 'home'
    | 'chevron-left'
    | 'chevron-right';

interface IconProps {
    name: IconName | string;
    size?: number;
    color?: string;
    strokeWidth?: number;
    style?: StyleProp<ViewStyle>;
}

export const Icon = ({
    name,
    size = 24,
    color = THEME.colors.primary,
    strokeWidth = 2,
    style
}: IconProps) => {
    const commonProps = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    };

    switch (name) {
        case 'wallet':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </Svg>
            );
        case 'arrow-left':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="m12 19-7-7 7-7" />
                    <Path d="M19 12H5" />
                </Svg>
            );
        case 'arrow-right':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M5 12h14" />
                    <Path d="m12 5 7 7-7 7" />
                </Svg>
            );
        case 'arrow-up-right':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M7 7h10v10" />
                    <Path d="M7 17 17 7" />
                </Svg>
            );
        case 'copy':
            return (
                <Svg {...(commonProps as any)}>
                    <Rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <Path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </Svg>
            );
        case 'history':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <Path d="M3 3v5h5" />
                    <Path d="M12 7v5l4 2" />
                </Svg>
            );
        case 'settings':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <Circle cx="12" cy="12" r="3" />
                </Svg>
            );
        case 'check':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M20 6 9 17l-5-5" />
                </Svg>
            );
        case 'close':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M18 6 6 18" />
                    <Path d="m6 6 12 12" />
                </Svg>
            );
        case 'plus':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M5 12h14" />
                    <Path d="M12 5v14" />
                </Svg>
            );
        case 'shield':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </Svg>
            );
        case 'refresh':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <Path d="M3 3v5h5" />
                    <Path d="m3 12 9 9 9.75-2.74L21 16" />
                    <Path d="M16 21v-5h5" />
                </Svg>
            );
        case 'eye':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <Circle cx="12" cy="12" r="3" />
                </Svg>
            );
        case 'eye-off':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <Path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <Line x1="2" x2="22" y1="2" y2="22" />
                </Svg>
            );
        case 'network':
            return (
                <Svg {...(commonProps as any)}>
                    <Rect x="16" y="16" width="6" height="6" rx="1" />
                    <Rect x="2" y="16" width="6" height="6" rx="1" />
                    <Rect x="9" y="2" width="6" height="6" rx="1" />
                    <Path d="M5 16v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
                    <Path d="M12 11V8" />
                </Svg>
            );
        case 'qrc':
            return (
                <Svg {...(commonProps as any)}>
                    <Rect x="3" y="3" width="7" height="7" rx="1" />
                    <Rect x="14" y="3" width="7" height="7" rx="1" />
                    <Rect x="3" y="14" width="7" height="7" rx="1" />
                    <Path d="M14 14h3v3h-3z" />
                    <Path d="M14 21h7v-3" />
                    <Path d="M21 14v3" />
                </Svg>
            );
        case 'send':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="m22 2-7 20-4-9-9-4Z" />
                    <Path d="M22 2 11 13" />
                </Svg>
            );
        case 'receive':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <Polyline points="7 10 12 15 17 10" />
                    <Line x1="12" x2="12" y1="3" y2="15" />
                </Svg>
            );
        case 'backspace':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M9 19H20a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H9l-7 7Z" />
                    <Path d="m12 9 6 6" />
                    <Path d="m18 9-6 6" />
                </Svg>
            );
        case 'lock':
            return (
                <Svg {...(commonProps as any)}>
                    <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </Svg>
            );
        case 'trash':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M3 6h18" />
                    <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <Line x1="10" x2="10" y1="11" y2="17" />
                    <Line x1="14" x2="14" y1="11" y2="17" />
                </Svg>
            );
        case 'search':
            return (
                <Svg {...(commonProps as any)}>
                    <Circle cx="11" cy="11" r="8" />
                    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
                </Svg>
            );
        case 'arrow-down-left':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="M17 7 7 17" />
                    <Path d="M17 17H7V7" />
                </Svg>
            );
        case 'home':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <Polyline points="9 22 9 12 15 12 15 22" />
                </Svg>
            );
        case 'chevron-left':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="m15 18-6-6 6-6" />
                </Svg>
            );
        case 'chevron-right':
            return (
                <Svg {...(commonProps as any)}>
                    <Path d="m9 18 6-6-6-6" />
                </Svg>
            );
        default:
            return null;
    }
};
