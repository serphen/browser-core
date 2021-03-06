import React from 'react';
import { StyleSheet, View, Text, Image, TouchableWithoutFeedback, Platform, NativeModules } from 'react-native';
import ViewShot from 'react-native-view-shot';

import { elementTopMargin, cardBorderRadius, cardMargins, getCardWidth } from '../../styles/CardStyle';
import { getMessage } from '../../../core/i18n';
import NativeDrawabale from '../custom/NativeDrawable';

const PermissionManager = NativeModules.PermissionManagerModule;
const ShareCardModule = NativeModules.RNShare || NativeModules.ShareCardModule;

const OPTIONS = {
  format: 'png',
  quality: 0.8,
  result: 'data-uri',
};

const styles = width => StyleSheet.create({
  shareSection: {
    ...elementTopMargin,
    width,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDECEC',
    paddingTop: 10,
    paddingBottom: 5,
    marginBottom: 5,
  },
  shareText: {
    color: 'black',
    textAlign: 'center',
    fontSize: 10,
    marginRight: 5,
  },
  shareImage: {
    marginRight: 5,
    width: 15,
    height: 15,
  },
  shareOverlay: {
    position: 'absolute',
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    bottom: cardMargins.marginBottom,
    ...cardBorderRadius,
  }
});

export default class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      capturing: false,
    };
  }

  componentDidUpdate() {
    if (this.state.capturing) {
      setTimeout(view => view && view.capture()
        .then((res) => {
          this.setState({ capturing: false });
          if (res) {
            (ShareCardModule.open || ShareCardModule.share)(
              {
                url: res,
                title: this.props.title,
                subject: this.props.title,
              },
              () => {}, // temporary until an action for failure is defined
              () => {} // temporary until an action for success is defined
            );
          }
        }),
      0, this._view); // timeout to 0 to wait for the view to update
    }
  }

  shareCard() {
    if (Platform.OS === 'ios') {
      this.setState({ capturing: true });
      return;
    }

    // android needs to write on external storage
    const type = PermissionManager.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    const granted = PermissionManager.RESULTS.GRANTED;

    PermissionManager.check(type)
      .then(isGranted => (isGranted ? granted : PermissionManager.request(type)))
      .then(result => (result === granted ? this.setState({ capturing: true }) : false));
  }

  displaySharedViaCliqz() {
    return Platform.select({
      ios: (
        <View style={styles(getCardWidth()).shareSection}>
          <Image
            style={styles().shareImage}
            source={{ uri: 'AppIcon' }}
          />
          <Text style={styles().shareText}>
            { getMessage('mobile_card_shared_via', 'iOS') }
          </Text>
        </View>
      ),
      android: (
        <View style={styles(getCardWidth()).shareSection}>
          <Image
            style={styles().shareImage}
            source={{ uri: 'mipmap/ic_launcher' }}
          />
          <Text style={styles().shareText}>
            { getMessage('mobile_card_shared_via', 'Android') }
          </Text>
        </View>
      )
    });
  }

  displayShareLink() {
    return (
      <TouchableWithoutFeedback onPress={() => this.shareCard()}>
        <View style={styles(getCardWidth()).shareSection}>
          <NativeDrawabale
            style={styles().shareImage}
            source={'ic_share'}
            color={'#00AEF0'}
          />
          <Text style={styles().shareText}>{getMessage('mobile_share_card')}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    return (
      <View>
        <ViewShot ref={(view) => { this._view = view; }} options={OPTIONS}>
          <View style={this.props.style || {}}>
            { this.props.children }
            {
              this.state.capturing
                ?
                this.displaySharedViaCliqz()
                :
                this.displayShareLink()
            }
          </View>
        </ViewShot>
        <View style={styles().shareOverlay} >
          { this.displayShareLink() }
        </View>
      </View>
    );
  }
}
