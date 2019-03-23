import React, { Component } from 'react';
import { WebView, Platform } from 'react-native'
import RNFetchBlob from 'rn-fetch-blob';
import RNImageColorPicker from 'image-color-picker'
import { canvasHtml } from './canvas-html';

async function getColor(imagePath) {
  return RNImageColorPicker.getColor(imagePath)
}

export default class ImageColorPicker extends Component {
  state = {
    imageBlob: ''
  };

  componentDidMount() {
    this.getImage(this.props.imageUrl);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.imageUrl !== nextProps.imageUrl) {
      this.getImage(nextProps.imageUrl);
    }
  }

  getImage = async imageUrl => {
    try {

      const localImage = await RNFetchBlob.config({ fileCache: true }).fetch(
        'GET',
        imageUrl
      )

      // if we are on Android, then use native for Android
      if (Platform.OS === 'android') {
        let colors = [];
        const color = await getColor(localImage.path());
        color.forEach(c => {
          colors.push(c.split('-'));
        });
        this.imageColorPickerView.props.onMessage({
          promise: JSON.stringify({ 'message': 'imageColorPicker', 'payload': colors })
        });
        return;
      }

      const base64EncodedImage = await RNFetchBlob.fs.readFile(
        localImage.path(),
        'base64'
      );
      this.setState({ imageBlob: base64EncodedImage });
    } catch (error) {
      this.props.pickerCallback(error);
    }
  };

  render() {
    const { imageUrl, pickerCallback, pickerStyle } = this.props;

    return (
      <WebView
        ref={imageColorPickerView => (this.imageColorPickerView = imageColorPickerView)}
        source={{ html: canvasHtml(this.state.imageBlob, this.props) }}
        javaScriptEnabled={true}
        onMessage={pickerCallback}
        style={pickerStyle}
      />
    );
  }
}
