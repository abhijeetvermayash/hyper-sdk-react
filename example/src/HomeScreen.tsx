/* eslint-disable react-native/no-inline-styles */
import * as React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  NativeEventEmitter,
  NativeModules,
  Animated,
  Dimensions,
  BackHandler,
  ScrollView,
} from 'react-native';
import HyperAPIUtils from './API';
import HyperSdkReact from 'hyper-sdk-react';
import HyperUtils from './Utils';
import { Picker } from '@react-native-community/picker';

class HomeScreen extends React.Component {
  state = {
    animation: new Animated.Value(0),
    pickerSelected: 'ec',
  };

  navigation: any;
  preFetchPayload: {};
  signaturePayload: {};
  initiatePayload: {};
  eventListener: any;
  isPopupVisible: boolean;

  merchantId: string;
  clientId: string;
  merchantKeyId: string;
  signUrl: string;
  signature: string;
  customerId: string;
  mobile: string;
  email: string;
  apiKey: string;
  amount: string;

  constructor(props: { navigation: any }, context: any) {
    super(props, context);
    this.navigation = props.navigation;
    this.isPopupVisible = false;

    this.merchantId = '';
    this.clientId = '';
    this.merchantKeyId = '';
    this.signUrl = '';
    this.signature = '';
    this.customerId = '';
    this.mobile = '';
    this.email = '';
    this.apiKey = '';
    this.amount = '1.0';

    this.preFetchPayload = HyperUtils.generatePreFetchPayload(
      this.clientId,
      this.state.pickerSelected
    );
    this.signaturePayload = {};
    this.initiatePayload = {};
  }

  componentDidMount() {
    const eventEmitter = new NativeEventEmitter(NativeModules.HyperSdkReact);
    this.eventListener = eventEmitter.addListener('HyperEvent', (resp) => {
      HyperUtils.alertCallbackResponse('HomeScreen', resp);
    });

    BackHandler.addEventListener('hardwareBackPress', () => {
      if (this.isPopupVisible) {
        this.handleClose();
        return true;
      }
      return false;
    });
  }

  componentWillUnmount() {
    this.eventListener.remove();
    BackHandler.removeEventListener('hardwareBackPress', () => null);
  }

  handleOpen = () => {
    Animated.timing(this.state.animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    this.isPopupVisible = true;
  };

  handleClose = () => {
    Animated.timing(this.state.animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    this.isPopupVisible = false;
  };

  render() {
    const screenHeight = Dimensions.get('window').height;

    const backdrop = {
      transform: [
        {
          translateY: this.state.animation.interpolate({
            inputRange: [0, 0.01],
            outputRange: [screenHeight, 0],
            extrapolate: 'clamp',
          }),
        },
      ],
      opacity: this.state.animation.interpolate({
        inputRange: [0.01, 0.5],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    };

    const slideUp = {
      transform: [
        {
          translateY: this.state.animation.interpolate({
            inputRange: [0.01, 1],
            outputRange: [0, -1 * screenHeight],
            extrapolate: 'clamp',
          }),
        },
      ],
    };

    return (
      <>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.container}>
            <CustomButton
              title="Set Params"
              onPress={() => {
                this.handleOpen();
              }}
            />
            <View style={styles.pickerContainer}>
              <Picker
                style={styles.picker}
                selectedValue={this.state.pickerSelected}
                onValueChange={(val, index) => {
                  this.setState({ pickerSelected: val });
                  console.log(val, index);
                }}
              >
                <Picker.Item label="Express Checkout" value="ec" />
                <Picker.Item label="Payment Page" value="pp" />
              </Picker>
            </View>

            <CustomButton
              title="preFetch"
              onPress={() => {
                this.preFetchPayload = HyperUtils.generatePreFetchPayload(
                  this.clientId,
                  this.state.pickerSelected
                );
                // console.warn('preFetchPayload:', this.preFetchPayload);
                HyperSdkReact.preFetch(JSON.stringify(this.preFetchPayload));
              }}
            />
            <CustomButton
              title="Create HyperService Object"
              onPress={() => {
                HyperSdkReact.createHyperServices();
              }}
            />

            <View style={styles.horizontal}>
              {this.state.pickerSelected === 'pp' ? (
                <CustomButton
                  title="Sign Initiate"
                  onPress={() => {
                    this.signaturePayload = {
                      merchant_id: this.merchantId,
                      customer_id: this.customerId,
                      timestamp: HyperUtils.getTimestamp(),
                    };
                    HyperUtils.signData(
                      this.signUrl,
                      JSON.stringify(this.signaturePayload)
                    ).then((resp) => {
                      console.warn(resp);
                      this.signature = resp;
                      HyperUtils.showCopyAlert(
                        'Payload signed',
                        this.signature
                      );
                    });
                  }}
                />
              ) : null}
              <CustomButton
                title="Initiate"
                onPress={() => {
                  this.initiatePayload =
                    this.state.pickerSelected === 'ec'
                      ? HyperUtils.generateECInitiatePayload(
                          this.merchantId,
                          this.clientId,
                          this.customerId
                        )
                      : HyperUtils.generatePPInitiatePayload(
                          this.clientId,
                          JSON.stringify(this.signaturePayload),
                          this.signature,
                          this.merchantKeyId
                        );
                  // console.warn('initiatePayload:', this.initiatePayload);
                  HyperSdkReact.initiate(JSON.stringify(this.initiatePayload));
                }}
              />
            </View>
            <CustomButton
              title="Process"
              onPress={() => {
                this.navigation.navigate('ProcessScreen', {
                  merchantId: this.merchantId,
                  clientId: this.clientId,
                  customerId: this.customerId,
                  mobile: this.mobile,
                  email: this.email,
                  amount: this.amount,
                  apiKey: this.apiKey,
                  merchantKeyId: this.merchantKeyId,
                  signUrl: this.signUrl,
                  service: this.state.pickerSelected,
                });
              }}
            />
            <CustomButton
              title="Is Initialised?"
              onPress={() => {
                HyperSdkReact.isInitialised().then((init: boolean) => {
                  // console.warn('isInitialised:', init);
                  HyperUtils.showCopyAlert('isInitialised', init + '');
                });
              }}
            />
            <CustomButton
              title="Terminate"
              onPress={() => {
                HyperSdkReact.terminate();
              }}
            />
          </View>
        </ScrollView>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.cover, backdrop]}
        >
          <View style={[styles.sheet]}>
            <Animated.View style={[styles.popup, slideUp]}>
              <View>
                <View style={styles.horizontal}>
                  <TextInput
                    style={styles.editText}
                    placeholder="merchantId"
                    onChangeText={(text) => {
                      this.merchantId = text;
                    }}
                    defaultValue={this.merchantId}
                  />
                  <TextInput
                    style={styles.editText}
                    placeholder="clientId"
                    onChangeText={(text) => {
                      this.clientId = text;
                    }}
                    defaultValue={this.clientId}
                  />
                </View>
                <View style={styles.horizontal}>
                  <TextInput
                    style={styles.editText}
                    placeholder="customerId"
                    onChangeText={(text) => {
                      this.customerId = text;
                    }}
                    defaultValue={this.customerId}
                  />
                  <TextInput
                    style={styles.editText}
                    placeholder="mobile"
                    onChangeText={(text) => {
                      this.mobile = text;
                    }}
                    defaultValue={this.mobile}
                  />
                </View>
                <View style={styles.horizontal}>
                  <TextInput
                    style={styles.editText}
                    placeholder="email"
                    onChangeText={(text) => {
                      this.email = text;
                    }}
                    defaultValue={this.email}
                  />
                  <TextInput
                    style={styles.editText}
                    placeholder="amount"
                    onChangeText={(text) => {
                      this.amount = text;
                    }}
                    defaultValue={this.amount}
                  />
                </View>
                <View style={styles.horizontal}>
                  <TextInput
                    style={[styles.editText, { width: '60%' }]}
                    placeholder="apiKey"
                    onChangeText={(text) => {
                      this.apiKey = text;
                    }}
                    defaultValue={this.apiKey}
                  />
                  <TextInput
                    style={[styles.editText, { width: '30%' }]}
                    placeholder="merchantKeyId"
                    onChangeText={(text) => {
                      this.merchantKeyId = text;
                    }}
                    defaultValue={this.merchantKeyId}
                  />
                </View>
                <View style={styles.horizontal}>
                  <TextInput
                    style={styles.longEditText}
                    placeholder="signUrl"
                    onChangeText={(text) => {
                      this.signUrl = text;
                    }}
                    defaultValue={this.signUrl}
                  />
                </View>
              </View>
              <View style={styles.horizontal}>
                <CustomButton
                  title="Create Customer"
                  onPress={() => {
                    HyperAPIUtils.createCustomer(
                      this.customerId,
                      this.mobile,
                      this.email,
                      this.apiKey
                    )
                      .then((resp) => {
                        console.log(resp);
                        HyperUtils.showCopyAlert('createCustomer', resp);
                      })
                      .catch((err) => {
                        console.error(err);
                      });
                  }}
                />
                <CustomButton title="Close" onPress={this.handleClose} />
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: 'blue',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginVertical: 12,
    marginEnd: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  cover: {
    backgroundColor: 'rgba(0,0,0,.5)',
  },
  sheet: {
    position: 'absolute',
    top: Dimensions.get('window').height,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
  },
  popup: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  horizontal: {
    flexDirection: 'row',
    marginHorizontal: 30,
  },
  editText: {
    height: 40,
    width: '45%',
    borderColor: 'gray',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 12,
    marginEnd: 20,
  },
  longEditText: {
    height: 40,
    width: '95%',
    borderColor: 'gray',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 12,
    marginEnd: 20,
  },
  picker: {
    width: 250,
  },
  pickerContainer: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 12,
  },
});

const CustomButton = (props: any) => {
  return (
    <TouchableOpacity onPress={props.onPress} style={styles.button}>
      <Text style={styles.buttonText}>{props.title}</Text>
    </TouchableOpacity>
  );
};

export default HomeScreen;
