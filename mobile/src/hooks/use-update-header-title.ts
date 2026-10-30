import { useNavigation } from "expo-router";
import { useEffect } from "react";

const useUpdateHeaderTitle = (
  title: string,
  onHeaderRight?: React.ReactNode,
) => {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      headerTitle: title.charAt(0).toUpperCase().concat(title.slice(1)),
      headerRight: () => onHeaderRight,
    });
  }, [navigation, title, onHeaderRight]);
};

export default useUpdateHeaderTitle;
