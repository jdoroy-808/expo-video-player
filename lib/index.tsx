import { AVPlaybackStatus, VideoProps } from 'expo-av/build/Video'
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  ImageURISource,
  LayoutChangeEvent,
  Slider,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  TouchableWithoutFeedback,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native'
import { Audio, Video } from 'expo-av'
import { Color } from 'csstype'
import {
  FullscreenEnterIcon,
  FullscreenExitIcon,
  PauseIcon,
  PlayIcon,
  ReplayIcon,
  Spinner,
  VolumeOffIcon,
  VolumeUpIcon,
} from './assets/icons'
import { useNetInfo } from '@react-native-community/netinfo'
import { withDefaultProps } from 'with-default-props'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { ReactNode, useEffect, useState } from 'react'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const IOS_THUMB_IMAGE = require('./assets/thumb.png')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const IOS_TRACK_IMAGE = require('./assets/track.png')
const SLIDER_COLOR: Color = '#0088FF'

// UI states
enum ControlStates {
  Shown = 'Show',
  Showing = 'Showing',
  Hidden = 'Hidden',
  Hiding = 'Hiding',
}

enum PlaybackStates {
  Loading = 'Loading',
  Playing = 'Playing',
  Paused = 'Paused',
  Buffering = 'Buffering',
  Error = 'Error',
  Ended = 'Ended',
}

enum SeekStates {
  NotSeeking = 'NotSeeking',
  Seeking = 'Seeking',
  Seeked = 'Seeked',
}

enum ErrorSeverity {
  Fatal = 'Fatal',
  NonFatal = 'NonFatal',
}

type Error = {
  type: ErrorSeverity
  message: string
  obj: object
}

const defaultProps = {
  children: null,
  debug: false,

  inFullscreen: false,

  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,

  // Animations
  fadeInDuration: 200,
  fadeOutDuration: 1000,
  quickFadeOutDuration: 200,
  hideControlsTimerDuration: 4000,

  // Icons
  playIcon: PlayIcon,
  replayIcon: ReplayIcon,
  pauseIcon: PauseIcon,
  spinner: Spinner,
  fullscreenEnterIcon: FullscreenEnterIcon,
  fullscreenExitIcon: FullscreenExitIcon,

  // Appearance
  showFullscreenButton: true,
  iosThumbImage: IOS_THUMB_IMAGE,
  iosTrackImage: IOS_TRACK_IMAGE,
  textStyle: {
    color: '#FFF',
    fontSize: 12,
  },
  videoBackground: '#000',

  // Callbacks
  videoRef: (vid: Video | null) => {},
  errorCallback: (error: Error) => console.error('Error: ', error.message, error.type, error.obj),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  playbackCallback: (callback: AVPlaybackStatus) => {},
  switchToLandscape: () => console.warn(`Pass your logic to 'switchToLandscape' prop`),
  switchToPortrait: () => console.warn(`Pass your logic to 'switchToPortrait' prop`),
  onControlPress: () => {},
  onBackgroundPress: (controlState: ControlStates) => {},
  showControlsOnLoad: false,
  sliderColor: SLIDER_COLOR,

  // Custom
  showMuteButton: false,
}

type Props = {
  // Expo props
  videoProps: VideoProps

  inFullscreen: boolean

  width: number
  height: number

  children: ReactNode

  // Animations
  fadeInDuration: number
  fadeOutDuration: number
  quickFadeOutDuration: number
  hideControlsTimerDuration: number

  // Icons
  playIcon: () => JSX.Element
  replayIcon: () => JSX.Element
  pauseIcon: () => JSX.Element
  spinner: () => JSX.Element
  fullscreenEnterIcon: () => JSX.Element
  fullscreenExitIcon: () => JSX.Element

  // Appearance
  showFullscreenButton: boolean
  iosThumbImage: ImageURISource
  iosTrackImage: ImageURISource
  textStyle: TextStyle
  videoBackground: Color

  // Callbacks
  debug: boolean
  videoRef: (vid: Video | null) => void
  playbackCallback: (callback: AVPlaybackStatus) => void
  errorCallback: (error: Error) => void
  switchToLandscape: () => void
  switchToPortrait: () => void
  onControlPress: () => void
  onBackgroundPress: (controlState: ControlStates) => void
  showControlsOnLoad: boolean
  sliderColor: Color

  // Custom
  showMuteButton: boolean
}

const VideoPlayer = (props: Props) => {
  let playbackInstance: Video | null = null
  let showingAnimation: Animated.CompositeAnimation | null = null
  let hideAnimation: Animated.CompositeAnimation | null = null
  let shouldPlayAtEndOfSeek = false
  let controlsTimer: NodeJS.Timeout | null = null

  const { isConnected } = useNetInfo()
  const [playbackState, setPlaybackState] = useState<PlaybackStates>(PlaybackStates.Loading)
  const [seekState, setSeekState] = useState<SeekStates>(SeekStates.NotSeeking)
  const [playbackInstancePosition, setPlaybackInstancePosition] = useState(0)
  const [playbackInstanceDuration, setPlaybackInstanceDuration] = useState(0)
  const [isOn, setIsOn] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [shouldPlay, setShouldPlay] = useState(false)
  const [error, setError] = useState('')
  const [sliderWidth, setSliderWidth] = useState(0)
  const [controlsState, setControlsState] = useState(
    props.showControlsOnLoad ? ControlStates.Shown : ControlStates.Hidden
  )
  const [controlsOpacity] = useState(new Animated.Value(props.showControlsOnLoad ? 1 : 0))
  const [isMuted, setIsMuted] = useState(false)

  // Set audio mode to play even in silent mode (like the YouTube app)
  const setAudio = async () => {
    const { errorCallback } = props

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      })
    } catch (e) {
      errorCallback({
        type: ErrorSeverity.NonFatal,
        message: 'setAudioModeAsync error',
        obj: e,
      })
    }
  }

  useEffect(() => {
    const { videoProps } = props

    if (videoProps.source === null) {
      console.error('`Source` is a required property')
      throw new Error('`Source` is required')
    }

    setAudio()
  })

  // Handle events during playback
  const updatePlaybackState = (newPlaybackState: PlaybackStates) => {
    if (playbackState !== newPlaybackState) {
      const { debug } = props
      debug &&
        console.info(
          '[playback]',
          playbackState,
          ' -> ',
          newPlaybackState,
          ' [seek] ',
          seekState,
          ' [shouldPlay] ',
          shouldPlay
        )
      setPlaybackState(newPlaybackState)
    }
  }

  const updateSeekState = (newSeekState: SeekStates) => {
    const { debug } = props

    debug &&
      console.info(
        '[seek]',
        seekState,
        ' -> ',
        newSeekState,
        ' [playback] ',
        playbackState,
        ' [shouldPlay] ',
        shouldPlay
      )

    setSeekState(newSeekState)

    // Don't keep the controls timer running when the state is seeking
    if (newSeekState === SeekStates.Seeking) {
      controlsTimer && clearTimeout(controlsTimer)
    } else {
      // Start the controlFs timer anew
      resetControlsTimer()
    }
  }

  const updatePlaybackCallback = (status: AVPlaybackStatus) => {
    const { errorCallback, playbackCallback } = props

    try {
      playbackCallback(status)
    } catch (e) {
      console.error('Uncaught error when calling props.playbackCallback', e)
    }

    if (!status.isLoaded) {
      if (status.error) {
        updatePlaybackState(PlaybackStates.Error)
        const errorMsg = `Encountered a fatal error during playback: ${status.error}`
        setError(errorMsg)
        errorCallback({ type: ErrorSeverity.Fatal, message: errorMsg, obj: {} })
      }
    } else {
      setIsPlaying(status.isPlaying)
      // Update current position, duration, and `shouldPlay`
      setPlaybackInstancePosition(status.positionMillis || 0)
      setPlaybackInstanceDuration(status.durationMillis || 0)
      setShouldPlay(status.shouldPlay)

      // Figure out what state should be next (only if we are not seeking,
      // other the seek action handlers control the playback state, not this callback)
      if (seekState === SeekStates.NotSeeking && playbackState !== PlaybackStates.Ended) {
        if (status.didJustFinish && !status.isLooping) {
          updatePlaybackState(PlaybackStates.Ended)
        } else {
          // If the video is buffering but there is no Internet, you go to the Error state
          if (!isConnected && status.isBuffering) {
            updatePlaybackState(PlaybackStates.Error)
            setError(
              'You are probably offline.' +
                'Please make sure you are connected to the Internet to watch this video'
            )
          } else {
            updatePlaybackState(isPlayingOrBufferingOrPaused(status))
          }
        }
      }
    }
  }

  // Seeking
  const getSeekSliderPosition = () => playbackInstancePosition / playbackInstanceDuration || 0

  const onSeekSliderValueChange = async () => {
    if (playbackInstance !== null && seekState !== SeekStates.Seeking) {
      updateSeekState(SeekStates.Seeking)
      // A seek might have finished (Seeked) but since we are not in NotSeeking yet, the `shouldPlay` flag is still false,
      // but we really want it be the stored value from before the previous seek
      shouldPlayAtEndOfSeek = seekState === SeekStates.Seeked ? shouldPlayAtEndOfSeek : shouldPlay
      // Pause the video
      await playbackInstance.setStatusAsync({ shouldPlay: false })
    }
  }

  const onSeekSliderSlidingComplete = async (value: number) => {
    if (playbackInstance !== null) {
      const { debug } = props
      // Seeking is done, so go to Seeked, and set playbackState to Buffering
      updateSeekState(SeekStates.Seeked)
      // If the video is going to play after seek, the user expects a spinner.
      // Otherwise, the user expects the play button
      updatePlaybackState(shouldPlayAtEndOfSeek ? PlaybackStates.Buffering : PlaybackStates.Paused)
      try {
        const playback = await playbackInstance.setStatusAsync({
          positionMillis: value * playbackInstanceDuration,
          shouldPlay: shouldPlayAtEndOfSeek,
        })

        // The underlying <Video> has successfully updated playback position
        // TODO: If `shouldPlayAtEndOfSeek` is false, should we still set the playbackState to Paused?
        // But because we setStatusAsync(shouldPlay: false), so the AVPlaybackStatus return value will be Paused.
        updateSeekState(SeekStates.NotSeeking)
        updatePlaybackState(isPlayingOrBufferingOrPaused(playback))
      } catch (e) {
        debug && console.error('Seek error: ', e)
      }
    }
  }

  const isPlayingOrBufferingOrPaused = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return PlaybackStates.Error
    }
    if (status.isPlaying) {
      return PlaybackStates.Playing
    }
    if (status.isBuffering) {
      return PlaybackStates.Buffering
    }

    return PlaybackStates.Paused
  }

  const onSeekBarTap = (e: GestureResponderEvent) => {
    if (
      !(
        playbackState === PlaybackStates.Loading ||
        playbackState === PlaybackStates.Ended ||
        playbackState === PlaybackStates.Error ||
        controlsState !== ControlStates.Shown
      )
    ) {
      const value = e.nativeEvent.locationX / sliderWidth
      onSeekSliderValueChange()
      onSeekSliderSlidingComplete(value)
    }
  }

  // Capture the width of the seekbar slider for use in `_onSeekbarTap`
  const onSliderLayout = (e: LayoutChangeEvent) => {
    setSliderWidth(e.nativeEvent.layout.width)
  }

  // Controls view
  const getMMSSFromMillis = (millis: number) => {
    const totalSeconds = millis / 1000
    const seconds = String(Math.floor(totalSeconds % 60))
    const minutes = String(Math.floor(totalSeconds / 60))

    return minutes.padStart(2, '0') + ':' + seconds.padStart(2, '0')
  }

  // Controls Behavior
  const replay = async () => {
    if (playbackInstance !== null) {
      await playbackInstance.setStatusAsync({
        shouldPlay: true,
        positionMillis: 0,
      })

      // Update playbackState to get out of Ended state
      setPlaybackState(PlaybackStates.Playing)
    }
  }

  const togglePlay = async () => {
    setIsOn(!isOn)
    if (controlsState === ControlStates.Hidden) {
      return
    }
    const shouldPlay = playbackState !== PlaybackStates.Playing
    if (playbackInstance !== null) {
      await playbackInstance.setStatusAsync({ shouldPlay })
    }
  }

  const toggleControls = () => {
    props.onBackgroundPress(controlsState)
    switch (controlsState) {
      case ControlStates.Shown:
        // If the controls are currently Shown, a tap should hide controls quickly

        if (isPlaying) {
          setControlsState(ControlStates.Hiding)
          hideControls(true)
        }
        break
      case ControlStates.Hidden:
        // If the controls are currently, show controls with fade-in animation
        showControls()
        setControlsState(ControlStates.Showing)
        break
      case ControlStates.Hiding:
        // If controls are fading out, a tap should reverse, and show controls
        setControlsState(ControlStates.Showing)
        showControls()
        break
      case ControlStates.Showing:
        // A tap when the controls are fading in should do nothing
        break
    }
  }

  const toggleMute = async () => {
    const nextIsMuted = !isMuted

    await playbackInstance?.setIsMutedAsync(nextIsMuted)

    setIsMuted(nextIsMuted)
  }

  const showControls = () => {
    const { fadeInDuration } = props

    showingAnimation = Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: fadeInDuration,
      useNativeDriver: true,
    })

    showingAnimation.start(({ finished }) => {
      if (finished) {
        setControlsState(ControlStates.Shown)
        if (isPlaying && isOn) {
          resetControlsTimer()
        }
      }
    })
  }

  const hideControls = (immediately = false) => {
    const { quickFadeOutDuration, fadeOutDuration } = props

    if (controlsTimer) {
      clearTimeout(controlsTimer)
    }
    hideAnimation = Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: immediately ? quickFadeOutDuration : fadeOutDuration,
      useNativeDriver: true,
    })
    hideAnimation.start(({ finished }) => {
      if (finished) {
        setControlsState(ControlStates.Hidden)
      }
    })
  }

  const onTimerDone = () => {
    // After the controls timer runs out, fade away the controls slowly
    setControlsState(ControlStates.Hiding)
    hideControls()
  }

  const resetControlsTimer = () => {
    const { hideControlsTimerDuration } = props

    if (controlsTimer) {
      clearTimeout(controlsTimer)
    }

    controlsTimer = setTimeout(() => onTimerDone(), hideControlsTimerDuration)
  }

  const {
    playIcon: VideoPlayIcon,
    pauseIcon: VideoPauseIcon,
    spinner: VideoSpinner,
    fullscreenEnterIcon: VideoFullscreenEnterIcon,
    fullscreenExitIcon: VideoFullscreenExitIcon,
    replayIcon: VideoReplayIcon,
    switchToLandscape,
    switchToPortrait,
    inFullscreen,
    sliderColor,
    iosThumbImage,
    iosTrackImage,
    showFullscreenButton,
    textStyle,
    videoProps,
    videoBackground,
    width,
    height,
    showMuteButton,
  } = props

  const centeredContentWidth = 60
  const screenRatio = width / height

  let videoHeight = height
  let videoWidth = videoHeight * screenRatio

  if (videoWidth > width) {
    videoWidth = width
    videoHeight = videoWidth / screenRatio
  }

  // Do not let the user override `ref`, `callback`, and `style`
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ref, style, onPlaybackStatusUpdate, source, ...otherVideoProps } = videoProps

  const Control = ({
    callback,
    center,
    children,
    transparent = false,
    ...otherProps
  }: {
    callback: () => void
    center: boolean
    children: ReactNode
    transparent?: boolean
    otherProps?: TouchableOpacityProps
  }) => (
    <TouchableOpacity
      {...otherProps}
      hitSlop={{ top: 20, left: 20, bottom: 20, right: 20 }}
      onPress={() => {
        // resetControlsTimer()
        if (playbackState === PlaybackStates.Paused) {
          hideControls()
        }

        callback()
        props.onControlPress()
      }}
    >
      <View
        style={
          center && {
            backgroundColor: transparent ? 'transparent' : 'rgba(0, 0, 0, 0.4)',
            justifyContent: 'center',
            width: centeredContentWidth,
            height: centeredContentWidth,
            borderRadius: centeredContentWidth,
          }
        }
      >
        {children}
      </View>
    </TouchableOpacity>
  )

  const CenteredView = ({
    children,
    style: viewStyle,
    // pointerEvents,
    ...otherProps
  }: {
    children?: ReactNode
    style?: ViewStyle
    // pointerEvents?: PointerEvent
    otherProps?: ViewProps
  }) => (
    <Animated.View
      {...otherProps}
      style={[
        {
          position: 'absolute',
          left: (videoWidth - centeredContentWidth) / 2,
          top: (videoHeight - centeredContentWidth) / 2,
          width: centeredContentWidth,
          height: centeredContentWidth,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        },
        viewStyle,
      ]}
    >
      {children}
    </Animated.View>
  )

  const ErrorText = ({ text }: { text: string }) => (
    <View
      style={{
        position: 'absolute',
        top: videoHeight / 2,
        width: videoWidth - 40,
        marginRight: 20,
        marginLeft: 20,
      }}
    >
      <Text style={[textStyle, { textAlign: 'center' }]}>{text}</Text>
    </View>
  )

  return (
    <TouchableWithoutFeedback onPress={toggleControls}>
      <View style={{ backgroundColor: videoBackground }}>
        <Video
          source={source}
          ref={component => {
            playbackInstance = component
            ref && ref(component)
            props.videoRef && props.videoRef(component)
            setIsOn(otherVideoProps.shouldPlay || false)
          }}
          onPlaybackStatusUpdate={updatePlaybackCallback}
          style={{
            width: videoWidth,
            height: videoHeight,
          }}
          {...otherVideoProps}
        />

        {/* Spinner */}
        {/* Due to loading Animation, it cannot use CenteredView */}
        {(playbackState === PlaybackStates.Buffering ||
          playbackState === PlaybackStates.Loading) && (
          <View
            style={{
              position: 'absolute',
              left: (videoWidth - centeredContentWidth) / 2,
              top: (videoHeight - centeredContentWidth) / 2,
              width: centeredContentWidth,
              height: centeredContentWidth,
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <VideoSpinner />
          </View>
        )}

        {/* Play/pause buttons */}
        {seekState !== SeekStates.Seeking &&
          (playbackState === PlaybackStates.Playing || playbackState === PlaybackStates.Paused) && (
            <CenteredView
              pointerEvents={controlsState === ControlStates.Hidden ? 'none' : 'auto'}
              // @ts-ignore
              style={{ opacity: controlsOpacity }}
            >
              <Control center={true} callback={togglePlay}>
                {/* Due to rendering, we have to split them */}
                {playbackState === PlaybackStates.Playing && <VideoPauseIcon />}
                {playbackState === PlaybackStates.Paused && <VideoPlayIcon />}
              </Control>
            </CenteredView>
          )}

        {/* Replay button to show at the end of a video */}
        {playbackState === PlaybackStates.Ended && (
          <CenteredView>
            <Control center={true} callback={replay}>
              <VideoReplayIcon />
            </Control>
          </CenteredView>
        )}

        {/* Error display */}
        {playbackState === PlaybackStates.Error && <ErrorText text={error} />}

        {/* Bottom bar */}
        <Animated.View
          pointerEvents={controlsState === ControlStates.Hidden ? 'none' : 'auto'}
          style={{
            position: 'absolute',
            bottom: 0,
            width: videoWidth,
            opacity: controlsOpacity,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 4,
            paddingHorizontal: 4,
          }}
        >
          {/* Current time display */}
          <Text style={[textStyle, { backgroundColor: 'transparent', marginLeft: 5 }]}>
            {getMMSSFromMillis(playbackInstancePosition)}
          </Text>

          {/* Seek bar */}
          <TouchableWithoutFeedback onLayout={onSliderLayout} onPress={onSeekBarTap}>
            <Slider
              style={{ marginRight: 10, marginLeft: 10, flex: 1 }}
              thumbTintColor={sliderColor}
              minimumTrackTintColor={sliderColor}
              trackImage={iosTrackImage}
              thumbImage={iosThumbImage}
              value={getSeekSliderPosition()}
              onValueChange={onSeekSliderValueChange}
              onSlidingComplete={onSeekSliderSlidingComplete}
              disabled={
                playbackState === PlaybackStates.Loading ||
                playbackState === PlaybackStates.Ended ||
                playbackState === PlaybackStates.Error ||
                controlsState !== ControlStates.Shown
              }
            />
          </TouchableWithoutFeedback>

          {/* Duration display */}
          <Text style={[textStyle, { backgroundColor: 'transparent', marginRight: 5 }]}>
            {getMMSSFromMillis(playbackInstanceDuration)}
          </Text>

          {/* Fullscreen control */}
          {showFullscreenButton && (
            <Control
              transparent={true}
              center={false}
              callback={() => {
                inFullscreen ? switchToPortrait() : switchToLandscape()
              }}
            >
              {inFullscreen ? <VideoFullscreenExitIcon /> : <VideoFullscreenEnterIcon />}
            </Control>
          )}

          {showMuteButton && (
            <Control transparent center={false} callback={toggleMute}>
              {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </Control>
          )}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  )
}

export default withDefaultProps(VideoPlayer, defaultProps)
