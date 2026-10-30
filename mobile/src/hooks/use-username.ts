import { useUser } from "@clerk/expo";

const useUsername = () => {
  const { user } = useUser();

  if (user?.fullName) {
    return user.fullName;
  } else if (user?.firstName) {
    return user.firstName;
  } else if (user?.firstName) {
    return user.firstName;
  } else if (user?.lastName) {
    return user.lastName;
  } else {
    const username = user?.emailAddresses[0].emailAddress.split("@")[0];
    return `${username?.charAt(0).toUpperCase()}${username?.slice(1)}`;
  }
};

export default useUsername;
