// import MessageContainer from "@/components/message-container";
// import { SocketEvent } from "@/utils/models";
// import { Text, useTheme } from "@rneui/themed";
// import { View } from "react-native";
// import { ScrollView } from "react-native-virtualized-view";

import ControlLogs from "@/components/control-logs";
import { useHouseId } from "@/hooks/use-house";
import { ActivityIndicator } from "react-native";

// const getNotificationHeading = (eventName: SocketEvent) => {
//   switch (eventName) {
//     case SocketEvent.ADD_ROOM:
//       return "Room Created";
//     case SocketEvent.REMOVE_ROOM:
//       return "Room Removed";
//     case SocketEvent.ADD_DEVICE:
//       return "Device Created";
//     case SocketEvent.CONFIGURE_DEVICE:
//       return "Device Configured";
//     case SocketEvent.SWITCH_DEVICE:
//       return "Device Switched";
//     case SocketEvent.REMOVE_DEVICE:
//       return "Device Removed";
//     default:
//       return eventName.replace("_", " ");
//   }
// };

// const Notifications = () => {
//   const { theme } = useTheme();

//   // const notifications = useSocketNotifications();

//   const notifications: any[] = [];

//   return (
//     <View
//       style={{
//         flex: 1,
//         padding: 16,
//         paddingBottom: 90,
//         backgroundColor: theme.colors.primary,
//       }}
//     >
//       <ScrollView>
//         <View style={{ gap: 16 }}>
//           {notifications.length > 0 ? (
//             notifications.map((notif, idx) => (
//               <View
//                 key={idx}
//                 style={{
//                   backgroundColor: theme.colors.secondary,
//                   padding: 12,
//                   borderRadius: 12,
//                   gap: 8,
//                 }}
//               >
//                 <Text
//                   style={{ flexWrap: "wrap", fontFamily: "Lexend_600SemiBold" }}
//                 >
//                   {getNotificationHeading(notif.event)}
//                 </Text>
//                 <Text style={{ flexWrap: "wrap" }}>{notif.message}</Text>
//                 <Text
//                   style={{
//                     flexWrap: "wrap",
//                     fontSize: 12,
//                     color: theme.colors.grey3,
//                   }}
//                 >
//                   {notif.date.toDateString()}
//                   {" : "}
//                   {notif.date.toLocaleTimeString()}
//                 </Text>
//               </View>
//             ))
//           ) : (
//             <MessageContainer message="No new notification." />
//           )}
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// export default Notifications;

const Notifications = () => {
  const houseId = useHouseId();

  if (!houseId) {
    return <ActivityIndicator />;
  }

  return <ControlLogs logType="house" houseId={houseId} />;
};

export default Notifications;
