import React, {useState,useEffect,useRef} from 'react';
import {StyleSheet, View, Text, Button,PermissionsAndroid,  Vibration, Switch } from 'react-native';
import MapView,{Marker, Polygon} from 'react-native-maps';
import firestore from '@react-native-firebase/firestore'
import Sound from 'react-native-sound';
import auth from '@react-native-firebase/auth';


import BackgroundGeolocation, {Location,Subscription} from "react-native-background-geolocation";

import BackgroundFetch from 'react-native-background-fetch';
//Para la compilación al parecer es necesario utilizar la versión jdk 11 de java


export default function Map()  {



const [userCoordinates, setUserCoordinates] = useState<LatLng[]>([]);
const [markerUbi, setMarkerUbi] = useState<Location | null>(null);
const [isMarkerInsidePolygon, setIsMarkerInsidePolygon] = useState(false); 
const isInitialMount = useRef(true);
const [isSoundLoaded, setIsSoundLoaded] = useState(false);
const [alarmActivated, setAlarmActivated] = useState(false);
const alarmSound =  useRef<Sound | null>(null);

const [location, setLocation] = useState('');



const startTracking = () => {

    BackgroundGeolocation.stop()

    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      stationaryRadius: 10,
      distanceFilter: 15,
      notification: {
        title: 'Background tracking',
        text: 'enabled',
      },
      debug: true,
      startOnBoot: true,
      stopOnTerminate: false,
    });

    BackgroundGeolocation.onLocation(async(location: Location) => {
      console.log('[BackgroundGeolocation] Desde StartTracking', location);
      const isInsidePolygon = isLocationInsidePolygons(location, polygonData);

      setMarkerUbi(location);


      if (isInsidePolygon) {
        setUserCoordinates((coor) => [
          ...coor,
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        ]);
        createCoords(location.coords.latitude, location.coords.longitude);
      }
      
      
      setLocation(JSON.stringify(location, null, 2));
    });

    BackgroundGeolocation.start();
   };

   
    const stopTracking = () => {
      BackgroundGeolocation.stop();
    };
    

    useEffect(() => {
      const interval = setInterval(() => {
        startTracking();
      }, 10000)
      return () => {
        clearInterval(interval);
      };
    }, []);
  
    const isLocationInsidePolygons = (location: Location, polygons: LatLng[][]) => {
      for (const polygon of polygons) {
        if (isPointInPolygon(location.coords, polygon)) {
          return true; // dentro al menos de un poligono
        }
      }
      return false; 
    };

useEffect(() => {
    const getLocation = async () => {
      const result = await requestLocationPermission();
    
      if (result) {
        const location = await BackgroundGeolocation.getCurrentPosition({});
        console.log('[BackgroundGeolocation] Desde GetLocation', location);

        const isInsidePolygon = isLocationInsidePolygons(location, polygonData)

        if (isInsidePolygon) { 
          setUserCoordinates((coor) => [
            ...coor,
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
          ]);
          createCoords(location.coords.latitude, location.coords.longitude);
        }
   
        setLocation(JSON.stringify(location, null, 2));
      }
    };
    
    const interval = setInterval(() => {
      getLocation();
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, []);



 const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location',
          message: 'Location?',
          buttonNeutral: 'Ask',
          buttonNegative: 'Deny',
          buttonPositive: 'OK',
        }
      );
      console.log('granted', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  };

 const loadAlarmSound = () => {
  if(alarmSound.current){
    alarmSound.current.play(() => {
      setIsSoundLoaded(true);
      console.log('Se cargo el sonido')
    });
  }
    
  };

  useEffect(() => {
    Sound.setCategory('Playback');
    const sound = new Sound('alarm20s.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Error al cargar sonido', error);
      } else {
        console.log('sonido cargado');
        setIsSoundLoaded(true);
        alarmSound.current = sound
        loadAlarmSound()
      }
    });

  
    return () => {
      if(alarmSound.current){
         alarmSound.current.release();
      }
     
    };
  }, []);

   useEffect(() => {
    if (isSoundLoaded && isMarkerInsidePolygon) {
      playAlarmSound()
      setAlarmActivated(true); 
    } else {
      stopAlarmSound()
      setAlarmActivated(false); 
    }
  }, [isMarkerInsidePolygon, isSoundLoaded]);




  const playAlarmSound = () => {
    if(isSoundLoaded && alarmSound.current){
      Vibration.vibrate([2000, 2000], true);
      alarmSound.current.play(() =>{
      stopAlarmSound()
      
    })
    }else{
      console.log('No se cargó el sonido')
    }
  };

  const stopAlarmSound = () => {
     Vibration.cancel()
       alarmSound.current?.stop() 
     
   
  };


  const sendArray = async (coords: LatLng[])=>{
    try{
      const timestamp = firestore.FieldValue.serverTimestamp()
      const user = auth().currentUser
      const userId = user?.uid
      if(user){
        await firestore().collection('regis').add({
          timestamp,
          coords,
          userId
        })

        setUserCoordinates([])
      }
      console.log(timestamp)

    }catch (error){
      console.log('array enviado a firestore',error)
      
    }

  }

  useEffect(()=>{
    const sendArrayInterval = setInterval(()=>{
      if(userCoordinates.length>0){
        sendArray(userCoordinates)
      }


    },10000)
    return()=>{
      clearInterval(sendArrayInterval)
    }

  },[userCoordinates])


  

const [polygonData, setPolygonData] = useState<LatLng[][]>([]);
const data: LatLng[] = [];
const queryData = () => {
  firestore()
    .collection('polygon')
    .get()
    .then((querySnapshot) => {
      const data: LatLng[][] = [];

      querySnapshot.forEach((documentSnapshot) => {
        const polygonDataArray = documentSnapshot.data().polygon;
        if (Array.isArray(polygonDataArray)) {
          const polygonCoords: LatLng[] = polygonDataArray.map((coords: any) => ({
            latitude: coords.latitude,
            longitude: coords.longitude,
          }));
          data.push(polygonCoords);
        }
      });

      setPolygonData(data);
    })
    .catch((error) => {
      console.error('Error', error);
    });
};

const isPointInPolygon = (point: LatLng, polygon: LatLng[]) => {
  const x = point.latitude
  const y = point.longitude

  let isInside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude
    const yi = polygon[i].longitude
    const xj = polygon[j].latitude
    const yj = polygon[j].longitude

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) isInside = !isInside
  }

  return isInside
}

const createCoords = (latitude: any, longitude: any) => {
  try {
    const currentUser = auth().currentUser;
    if (currentUser) {
       firestore()
        .collection('coords')
        .doc(currentUser.uid)
        .set({
          latitude: latitude,
          longitude: longitude,
        });
      console.log('documento de coordenadas creado');
    } 
  } catch (error) {
    console.error('error al crear documento', error);
  }
};



useEffect(() => {
  if (markerUbi && polygonData.length > 0) {

    let isInsidePolygons = false;    
    for (const polygon of polygonData) {
      const isInside = isPointInPolygon(markerUbi.coords, polygon);
      if (isInside) {
        isInsidePolygons = true;
      }
    }


    setIsMarkerInsidePolygon(isInsidePolygons);
   
     if(isInsidePolygons){
      playAlarmSound()
      createCoords(markerUbi.coords.latitude, markerUbi.coords.longitude)
      
    }else {
      stopAlarmSound()
    }


  }
}, [markerUbi, polygonData]);

const updateInside = () => {
  try {
    const currentUser = auth().currentUser;
    if (currentUser) {
      const userDocRef = firestore().collection('users').doc(currentUser.uid);
       userDocRef.update({
        inside: true,
      });
      console.log('actualizado');
    }
  } catch (error) {
    console.error('error al actualizar:', error);
  }
};

  


  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);




  useEffect(() => {
  
   queryData();
   
    const interval = setInterval(() => {

      queryData();
      updateInside()

    
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);
 


  


 return (

  <View style={styles.container}>
    
  {markerUbi && ( //si marker y localizacion no son nulos = inicialregion
  <MapView style={{width:380, height:700}} 
  initialRegion={{
    latitude: markerUbi.coords.latitude,
    longitude: markerUbi.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}>

    {polygonData.map((polygonCoords, index) => (
      <Polygon fillColor="rgba(255, 0, 0, 0.5)" key={index} coordinates={polygonCoords} />
    ))}
  
  {markerUbi && (
    <Marker coordinate={{ latitude: markerUbi.coords.latitude, longitude: markerUbi.coords.longitude}}/>
  )}
  
   </MapView> 
    )}

 <View style={{marginTop: 10, padding: 10, borderRadius: 10, width: '40%'}}>

</View>

{/* 
  {isMarkerInsidePolygon && polygonData.length > 0 ? <Text>dentro del poligono</Text> : null}
  
  <Button title="Desactivar Alarma" onPress={stopAlarmSound} /> */}


  </View>
 );
};

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#000000',
   alignItems: 'center',
   justifyContent: 'center',
 },
});


type LatLng = {
  latitude: number;
  longitude: number;
};
