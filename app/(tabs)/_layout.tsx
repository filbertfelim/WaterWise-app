import React from "react";
import { BottomNavigation } from "react-native-paper";
import { CommonActions } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import Monitor from ".";
import Analytics from "./analytics";

interface RouteParams {
  key: string;
  name: string;
  params?: {
    [key: string]: any;
  };
  state?: any;
  title?: string;
}

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          theme={{ colors: { secondaryContainer: "#E6FFFE" } }}
          navigationState={state}
          safeAreaInsets={insets}
          style={{ backgroundColor: "#ffffff" }}
          onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          }}
          renderIcon={({ route, focused, color }) => {
            const { options } = descriptors[route.key] as any;
            if (options.tabBarIcon) {
              return options.tabBarIcon({
                focused,
                color: focused ? "#01b5ad" : "#777777",
                size: 24,
              });
            }
            return null;
          }}
          getLabelText={({ route }: { route: RouteParams }) => {
            const { options } = descriptors[route.key] as any;
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.title;

            return label;
          }}
          activeColor="#01b5ad"
        />
      )}
    >
      <Tab.Screen
        name="Monitor"
        component={Monitor}
        options={{
          tabBarLabel: "Monitor",
          tabBarIcon: ({ color, size }) => (
            <Icon name="gauge" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={Analytics}
        options={{
          tabBarLabel: "Analytics",
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-line" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
