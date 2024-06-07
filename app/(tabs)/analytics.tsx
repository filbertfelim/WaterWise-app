import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { onValue, ref } from "firebase/database";
import { db } from "../../components/config";

const screenWidth = Dimensions.get("window").width - 40;

interface MoistureData {
  datetime: string;
  level: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: (opacity: number) => string;
    strokeWidth: number;
  }[];
  legend: string[];
}

const Analytics: React.FC = () => {
  const [moisture, setMoisture] = useState<number>(20);
  const [data, setData] = useState<MoistureData[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [highest, setHighest] = useState<MoistureData>({
    level: 0,
    datetime: "",
  });
  const [lowest, setLowest] = useState<MoistureData>({
    level: 0,
    datetime: "",
  });
  const [dateRange, setDateRange] = useState<string>("");
  const [chartConfigData, setChartConfigData] = useState<ChartData | null>(
    null
  );

  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    visible: boolean;
    value: number | null;
    label: string | null;
  }>({ x: 0, y: 0, visible: false, value: null, label: null });

  const fetchData = async () => {
    const moistureDataRef = ref(db, "moistureData");
    onValue(
      moistureDataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const snapshotData = snapshot.val();
          const formattedData: MoistureData[] = Object.keys(snapshotData).map(
            (key) => ({
              datetime: snapshotData[key].datetime,
              level: snapshotData[key].level,
            })
          );
          setData(formattedData);
        } else {
          console.log("No data available");
        }
      },
      (error) => {
        console.error("Error listening to Firebase:", error);
      }
    );
  };

  const calculateDailyAverages = (data: MoistureData[]) => {
    const groupedByDate = data.reduce<{ [key: string]: number[] }>(
      (acc, item) => {
        const date = new Date(item.datetime).toISOString().split("T")[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(item.level);
        return acc;
      },
      {}
    );

    const dailyAverages = Object.keys(groupedByDate).map((date) => ({
      date,
      average: Math.round(
        groupedByDate[date].reduce((sum, val) => sum + val, 0) /
          groupedByDate[date].length
      ),
    }));

    dailyAverages.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 8);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return dailyAverages.filter(
      (entry) =>
        new Date(entry.date).getTime() > oneWeekAgo.getTime() &&
        new Date(entry.date).getTime() <= yesterday.getTime()
    );
  };

  const findHighestAndLowest = (data: MoistureData[]) => {
    let highest = { level: -Infinity, datetime: "" };
    let lowest = { level: Infinity, datetime: "" };

    data.forEach((item) => {
      if (item.level > highest.level) {
        highest = { level: item.level, datetime: item.datetime };
      }
      if (item.level < lowest.level) {
        lowest = { level: item.level, datetime: item.datetime };
      }
    });

    return { highest, lowest };
  };

  useEffect(() => {
    if (data.length > 0) {
      const dailyAverages = calculateDailyAverages(data);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 8);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const oneWeekData = data.filter(
        (entry) =>
          new Date(entry.datetime).getTime() > oneWeekAgo.getTime() &&
          new Date(entry.datetime).getTime() <= yesterday.getTime()
      );

      const formattedDailyAverages = dailyAverages.map((d) => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("en-US", {
          timeZone: "Asia/Jakarta",
          month: "short",
          day: "numeric",
        }),
      }));

      const { highest, lowest } = findHighestAndLowest(oneWeekData);
      setLabels(formattedDailyAverages.map((d) => d.date));
      setChartData(formattedDailyAverages.map((d) => d.average));
      setHighest(highest);
      setLowest(lowest);

      if (formattedDailyAverages.length > 0) {
        const earliestDate = formattedDailyAverages[0].date;
        const latestDate = formattedDailyAverages[6].date;
        setDateRange(`${earliestDate} - ${latestDate}`);
      }

      if (labels.length > 0 && chartData.length > 0) {
        setChartConfigData({
          labels: labels,
          datasets: [
            {
              data: chartData,
              color: (opacity = 1) => `rgba(1, 181, 173, ${opacity})`,
              strokeWidth: 5,
            },
          ],
          legend: ["Average Moisture Level"],
        });
      }
    }
  }, [data]);

  useEffect(() => {
    fetchData();
  }, []);

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#fff",
    backgroundGradientToOpacity: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const handleDataPointClick = (data: any) => {
    const isSamePoint = tooltipPos.x === data.x && tooltipPos.y === data.y;

    if (isSamePoint) {
      setTooltipPos((previousState) => ({
        ...previousState,
        visible: !previousState.visible,
      }));
    } else {
      setTooltipPos({
        x: data.x,
        y: data.y,
        visible: true,
        value: data.value,
        label: labels[data.index],
      });
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
      <Text style={styles.historyTitle1}>
        Weekly <Text style={styles.historyTitle2}>History</Text>
      </Text>
      {chartConfigData ? (
        <>
          <Text style={styles.dateRange}>{dateRange}</Text>
          <View>
            <LineChart
              data={chartConfigData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              withShadow={false}
              withVerticalLines={true}
              yAxisSuffix="%"
              onDataPointClick={handleDataPointClick}
            />
            {tooltipPos.visible && (
              <View
                style={{
                  position: "absolute",
                  left: tooltipPos.x - 50,
                  top: tooltipPos.y - 30,
                  backgroundColor: "white",
                  padding: 5,
                  borderRadius: 5,
                  borderColor: "#01b5ad",
                  borderWidth: 1,
                }}
              >
                <Text>Date: {tooltipPos.label}</Text>
                <Text>Level: {tooltipPos.value}%</Text>
              </View>
            )}
          </View>
          <View style={styles.levelContainer}>
            <View style={styles.categoryContainer}>
              <Text style={styles.levelText}>Highest Level</Text>
              <Text style={styles.percentage}>
                {highest.level}%{" "}
                <Text style={styles.blackText}>
                  on{" "}
                  {new Date(highest.datetime).toLocaleString("en-US", {
                    timeZone: "Asia/Jakarta",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Text>
              </Text>
            </View>
            <View style={styles.categoryContainer}>
              <Text style={styles.levelText}>Lowest Level</Text>
              <Text style={styles.percentage}>
                {lowest.level}%{" "}
                <Text style={styles.blackText}>
                  on{" "}
                  {new Date(lowest.datetime).toLocaleString("en-US", {
                    timeZone: "Asia/Jakarta",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Text>
              </Text>
            </View>
          </View>
        </>
      ) : (
        <ActivityIndicator
          style={styles.loading}
          size="large"
          color="#01b5ad"
        />
      )}
    </View>
  );
};

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
  loading: {
    paddingTop: 60,
  },
  historyTitle1: {
    fontSize: 20,
    paddingBottom: 5,
    color: "#01b5ad",
    fontWeight: "bold",
  },
  historyTitle2: {
    fontSize: 20,
    fontWeight: "bold",
  },
  dateRange: {
    fontSize: 20,
    paddingBottom: 20,
    fontWeight: "600",
    color: "#828282",
  },
  levelText: {
    fontSize: 18,
    fontWeight: "600",
    paddingBottom: 10,
    color: "#828282",
  },
  percentage: {
    fontSize: 20,
    fontWeight: "600",
    color: "#01b5ad",
  },
  blackText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  levelContainer: {
    flex: 1,
    flexDirection: "column",
    paddingTop: 40,
    backgroundColor: "white",
  },
  categoryContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "white",
  },
});

export default Analytics;
