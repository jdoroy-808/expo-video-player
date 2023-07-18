import { ActivityIndicator, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Asset } from 'expo-asset';
import React from 'react';
const ICON_COLOR = '#FFF';
const CENTER_ICON_SIZE = 36;
const BOTTOM_BAR_ICON_SIZE = 30;
const style = StyleSheet.create({
    iconStyle: {
        textAlign: 'center',
    },
});
export const PlayIcon = () => (<MaterialIcons name='play-arrow' size={CENTER_ICON_SIZE} color={ICON_COLOR} style={style.iconStyle}/>);
export const PauseIcon = () => (<MaterialIcons name='pause' size={CENTER_ICON_SIZE} color={ICON_COLOR} style={style.iconStyle}/>);
export const Spinner = () => <ActivityIndicator color={ICON_COLOR} size='large'/>;
export const FullscreenEnterIcon = () => (<MaterialIcons name='fullscreen' size={BOTTOM_BAR_ICON_SIZE} color={ICON_COLOR} style={style.iconStyle}/>);
export const FullscreenExitIcon = () => (<MaterialIcons name='fullscreen-exit' size={BOTTOM_BAR_ICON_SIZE} color={ICON_COLOR} style={style.iconStyle}/>);
export const ReplayIcon = () => (<MaterialIcons name='replay' size={CENTER_ICON_SIZE} color={ICON_COLOR} style={style.iconStyle}/>);
// TODO: Define `any` type
const IconImage = ({ color, size = BOTTOM_BAR_ICON_SIZE, source, style }) => {
    return <Image source={source} style={[{ height: size, width: size, tintColor: color }, style]}/>;
};
export const VolumeOffIcon = () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const source = Asset.fromModule(require('./volume-off.png'));
    return <IconImage color={ICON_COLOR} source={source} style={style.iconStyle}/>;
};
export const VolumeUpIcon = () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const source = Asset.fromModule(require('./volume-up.png'));
    return <IconImage color={ICON_COLOR} source={source} style={style.iconStyle}/>;
};
