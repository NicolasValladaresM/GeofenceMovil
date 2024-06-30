import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button,StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore'


export default function Login() {
  const navigation = useNavigation();
    const[email,setEmail] = useState("")
    const[password,setPassword] = useState("")

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  
  function onAuthStateChanged(user) {

    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  
  const reset = () => {
    setEmail('');
    setPassword('');
  };



  const signInC = () => {
    auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);
          reset()
        firestore()
          .collection('users')
          .doc(user.uid) 
          .set({
            email: user.email,
            inside: false,

          })
          .then(() => {
            console.log('Usuario ha ingresado');
            
            navigation.navigate('Map');
          })
          .catch((error) => {
            console.error('error con guardar usuario', error);
          });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });

  };
  

  
    
      


  return (
    <View>
        <View   >
            <TextInput style={styles.input} color={'#000000'} borderColor={'0000FF'} placeholderTextColor={'#000000'} autoComplete='email' placeholder='Correo' id='email' onChangeText={(text) => setEmail(text)} value={email}/>
            <TextInput style={styles.input} color={'#000000'} borderColor={'0000FF'} secureTextEntry  placeholderTextColor={'#000000'} textContentType='password' placeholder='Contraseña' id='password' onChangeText={(text) => setPassword(text)} value={password}/>
            <Button title="Iniciar sesión" onPress={signInC} />
        </View>
      
    </View>
  );
 
  
}
 

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      borderColor: '#FF0000', 
      borderWidth: 1,
      padding: 10,
      marginBottom: 10,
      color: '#FFFFFF',
    }
   });
