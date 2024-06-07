import CircularProgress from "react-native-circular-progress-indicator";
import { View, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { useEffect, useState } from "react";
import Paho from "paho-mqtt";

const MQTT_BROKER_URL =
  "wss://5b441a4530cd42d19fd8887048d1dd55.s1.eu.hivemq.cloud:8884/mqtt";
const MQTT_TOPIC_MOISTURE = "smart/watering/moisture";
const MQTT_TOPIC_RELAY = "smart/watering/relay";

export default function Monitor() {
  const [moistureLevel, setMoistureLevel] = useState(20);
  const [pumpStatus, setPumpStatus] = useState("OFF");
  const [mqttConnect, setMqttConnect] = useState<boolean>(true);

  useEffect(() => {
    const client = new Paho.Client(
      "5b441a4530cd42d19fd8887048d1dd55.s1.eu.hivemq.cloud",
      Number(8884),
      "clientId"
    );
    client.onConnectionLost = (responseObject) => {
      if (responseObject.errorCode !== 0) {
        console.log("Connection lost:", responseObject.errorMessage);
        client.disconnect();
        client.connect(connectOptions);
      }
    };

    client.onMessageArrived = (message) => {
      if (message.destinationName === MQTT_TOPIC_MOISTURE) {
        const data = `${message.payloadString}`;
        setMoistureLevel(parseInt(data));
      } else if (message.destinationName === MQTT_TOPIC_RELAY) {
        const data = `${message.payloadString}`;
        setPumpStatus(data);
      }
    };

    const connectOptions = {
      onSuccess: () => {
        console.log("Connected!");
        setMqttConnect(false);
        client.subscribe(MQTT_TOPIC_MOISTURE);
        client.subscribe(MQTT_TOPIC_RELAY);
      },
      onFailure: () => {
        console.log("Failed to connect!");
        setMqttConnect(false);
      },
      userName: "smart-watering-system",
      password: "Smart123",
      useSSL: true,
    };

    client.connect(connectOptions);

    return () => {
      client.disconnect();
    };
  }, []);

  const getStrokeColor = (moistureLevel: number) => {
    if (moistureLevel < 20) {
      return "#ff0000";
    } else if (moistureLevel >= 20 && moistureLevel <= 30) {
      return "#ffa500";
    } else {
      return "#24b328";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          style={styles.tinyLogo}
          source={{ uri: "https://i.ibb.co.com/RQ1V8g5/logo.png" }}
        />
        <Text style={styles.appTitle}>WaterWise</Text>
      </View>
      <Text style={styles.moistureTitle1}>
        Current <Text style={styles.moistureTitle2}>Moisture Level</Text>
      </Text>
      {mqttConnect ? (
        <ActivityIndicator size="large" color="#01b5ad" />
      ) : (
        <>
          <View style={styles.circular}>
            <CircularProgress
              value={moistureLevel}
              valueSuffix={"%"}
              radius={110}
              progressValueColor={"#01b5ad"}
              activeStrokeColor={getStrokeColor(moistureLevel)}
              inActiveStrokeOpacity={0.25}
              activeStrokeWidth={20}
              maxValue={100}
              title={"moisturized"}
              titleColor={"#777777"}
              titleStyle={{ fontWeight: "bold" }}
            />
          </View>
          <Text style={styles.waterPumpText}>
            Water Pump Status :{" "}
            <Text style={styles.waterPumpStatus}>{pumpStatus}</Text>
          </Text>
        </>
      )}
      <View style={styles.levelCategoryContainer}>
        <View style={styles.categoryContainer}>
          <Text style={styles.levelStatus}>Low</Text>
          <Text style={styles.lowStatus}>{"< 20%"}</Text>
        </View>
        <View style={styles.categoryContainer}>
          <Text style={styles.levelStatus}>Medium</Text>
          <Text style={styles.mediumStatus}>{"20 - 30%"}</Text>
        </View>
        <View style={styles.categoryContainer}>
          <Text style={styles.levelStatus}>High</Text>
          <Text style={styles.highStatus}>{"> 30%"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 60,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingBottom: 50,
  },
  tinyLogo: {
    width: 60,
    height: 60,
    marginEnd: 10,
  },
  appTitle: {
    fontSize: 20,
  },
  moistureTitle1: {
    fontSize: 20,
    paddingBottom: 40,
    color: "#01b5ad",
    fontWeight: "bold",
  },
  moistureTitle2: {
    fontSize: 20,
    fontWeight: "bold",
  },
  waterPumpText: {
    fontSize: 20,
    fontWeight: "500",
  },
  waterPumpStatus: {
    fontSize: 20,
    fontWeight: "bold",
  },
  circular: {
    paddingBottom: 20,
  },
  levelCategoryContainer: {
    flex: 1,
    flexDirection: "row",
    paddingTop: 40,
    backgroundColor: "white",
  },
  categoryContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "white",
  },
  levelStatus: {
    fontSize: 20,
    fontWeight: "600",
    color: "#828282",
  },
  lowStatus: {
    fontSize: 20,
    paddingTop: 10,
    fontWeight: "600",
    color: "#ff0000",
  },
  mediumStatus: {
    fontSize: 20,
    paddingTop: 10,
    fontWeight: "600",
    color: "#ffa500",
  },
  highStatus: {
    fontSize: 20,
    paddingTop: 10,
    fontWeight: "600",
    color: "#24b328",
  },
});
