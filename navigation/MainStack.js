import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../login';
import  Map  from '../Map'

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator>
      
    <Stack.Screen name="Login" component={Login} />
     <Stack.Screen name="Map" component={Map} />
      
    </Stack.Navigator>
  );
};

export default MainStack;
