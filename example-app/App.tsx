import { ScrollView, StyleSheet } from 'react-native'
import { Video } from 'expo-av'
import React from 'react'
import VideoPlayer from './dist/index'

let video: Video | null = null;

const App = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
    <VideoPlayer
      videoProps={{
        shouldPlay: true,
        resizeMode: Video.RESIZE_MODE_CONTAIN,
        source: {
          uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        }
      }}
      inFullscreen={true}
      videoBackground='transparent'
      height={220}
      onBackgroundPress={(controlState: any) => {
        console.log('controlState', controlState);
        video.playAsync();
      }}
      videoRef={vid => {
        video = vid;
      }}
    />

    <VideoPlayer
      videoProps={{
        shouldPlay: false,
        resizeMode: Video.RESIZE_MODE_CONTAIN,
        source: {
          uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        },
      }}
      inFullscreen={true}
      showControlsOnLoad={true}
      showFullscreenButton={false}
      width={200}
      height={200}
    />

    <VideoPlayer
      videoProps={{
        shouldPlay: false,
        resizeMode: Video.RESIZE_MODE_CONTAIN,
        source: {
          uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        },
      }}
      inFullscreen={true}
      videoBackground='yellow'
      height={100}
    />

    <VideoPlayer
      videoProps={{
        shouldPlay: true,
        resizeMode: Video.RESIZE_MODE_CONTAIN,
        source: {
          uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        },
      }}
      inFullscreen={true}
    />
  </ScrollView>
)

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default App
