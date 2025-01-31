import { AVPlaybackStatus, VideoProps } from 'expo-av/build/Video';
import { ImageURISource, TextStyle } from 'react-native';
import { Video } from 'expo-av';
import { Color } from 'csstype';
import { ReactNode } from 'react';
declare enum ControlStates {
    Shown = "Show",
    Showing = "Showing",
    Hidden = "Hidden",
    Hiding = "Hiding"
}
declare enum ErrorSeverity {
    Fatal = "Fatal",
    NonFatal = "NonFatal"
}
declare type Error = {
    type: ErrorSeverity;
    message: string;
    obj: object;
};
declare type Props = {
    videoProps: VideoProps;
    inFullscreen: boolean;
    width: number;
    height: number;
    children: ReactNode;
    fadeInDuration: number;
    fadeOutDuration: number;
    quickFadeOutDuration: number;
    hideControlsTimerDuration: number;
    playIcon: () => JSX.Element;
    replayIcon: () => JSX.Element;
    pauseIcon: () => JSX.Element;
    spinner: () => JSX.Element;
    fullscreenEnterIcon: () => JSX.Element;
    fullscreenExitIcon: () => JSX.Element;
    showFullscreenButton: boolean;
    iosThumbImage: ImageURISource;
    iosTrackImage: ImageURISource;
    textStyle: TextStyle;
    videoBackground: Color;
    debug: boolean;
    videoRef: (vid: Video | null) => void;
    playbackCallback: (callback: AVPlaybackStatus) => void;
    errorCallback: (error: Error) => void;
    switchToLandscape: () => void;
    switchToPortrait: () => void;
    onControlPress: () => void;
    onBackgroundPress: (controlState: ControlStates) => void;
    showControlsOnLoad: boolean;
    sliderColor: Color;
    showMuteButton: boolean;
};
declare const _default: (props: Pick<Props, "videoProps"> & {
    children?: null | undefined;
    width?: number | undefined;
    height?: number | undefined;
    playIcon?: (() => JSX.Element) | undefined;
    pauseIcon?: (() => JSX.Element) | undefined;
    spinner?: (() => JSX.Element) | undefined;
    fullscreenEnterIcon?: (() => JSX.Element) | undefined;
    fullscreenExitIcon?: (() => JSX.Element) | undefined;
    replayIcon?: (() => JSX.Element) | undefined;
    switchToLandscape?: (() => void) | undefined;
    switchToPortrait?: (() => void) | undefined;
    inFullscreen?: boolean | undefined;
    sliderColor?: string | undefined;
    iosThumbImage?: any;
    iosTrackImage?: any;
    showFullscreenButton?: boolean | undefined;
    textStyle?: {
        color: string;
        fontSize: number;
    } | undefined;
    videoBackground?: string | undefined;
    showMuteButton?: boolean | undefined;
    errorCallback?: ((error: Error) => void) | undefined;
    debug?: boolean | undefined;
    playbackCallback?: ((callback: AVPlaybackStatus) => void) | undefined;
    fadeInDuration?: number | undefined;
    quickFadeOutDuration?: number | undefined;
    fadeOutDuration?: number | undefined;
    hideControlsTimerDuration?: number | undefined;
    videoRef?: ((vid: Video | null) => void) | undefined;
    onControlPress?: (() => void) | undefined;
    onBackgroundPress?: ((controlState: ControlStates) => void) | undefined;
    showControlsOnLoad?: boolean | undefined;
}, ref?: unknown) => JSX.Element;
export default _default;
