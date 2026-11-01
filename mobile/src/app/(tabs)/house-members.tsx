import SheetHeader from "@/components/sheet-header";
import {
  useAddHouseMember,
  useRemoveHouseMember,
  useUpdateHouseMember,
} from "@/hooks/use-house-member-mutations";
import useHouseMembers from "@/hooks/use-house-members";
import useSearchHouseUsers from "@/hooks/use-search-house-users";
import useHouse, { useHouseId } from "@/hooks/use-house";
import {
  HouseMemberProfile,
  HouseMemberMutationResponse,
} from "@/models/house-member";
import Feather from "@expo/vector-icons/Feather";
import { useUser } from "@clerk/expo";
import { BottomSheet, Button, Input, Text, useTheme } from "@rneui/themed";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import LoadingSkeleton from "@/components/loading-skeleton";
import {
  HouseMemberListSkeleton,
  SearchResultsSkeleton,
} from "@/components/loading-placeholders";

const getUserName = (member: HouseMemberProfile) => {
  const fullName = member.fullName?.trim();
  const name = [member.firstName, member.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName || name || member.username || member.emailAddress || member.id
  );
};

type PendingHouseMemberAction =
  | { type: "add"; member: HouseMemberProfile }
  | { type: "update"; member: HouseMemberProfile; isAdmin: boolean }
  | { type: "remove"; member: HouseMemberProfile };

const reportMutationError = (error: Error) => {
  Alert.alert("House members", error.message);
};

const reportResponseError = (response: HouseMemberMutationResponse) => {
  if (!response.success) {
    Alert.alert("House members", response.message);
  }
};

const HouseMembers = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const houseId = useHouseId();
  const houseQuery = useHouse();
  const membersQuery = useHouseMembers();
  const addMember = useAddHouseMember();
  const updateMember = useUpdateHouseMember();
  const removeMember = useRemoveHouseMember();
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingAction, setPendingAction] =
    useState<PendingHouseMemberAction | null>(null);
  const members = membersQuery.data?.success ? membersQuery.data.data : [];
  const currentHouseMember = members.find((member) => member.id === user?.id);
  const isAdmin = currentHouseMember?.isAdmin ?? false;

  useEffect(() => {
    const timeout = setTimeout(() => setSearchQuery(searchText.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const searchUsersQuery = useSearchHouseUsers(searchQuery, isAdmin);

  const isMutating =
    addMember.isPending || updateMember.isPending || removeMember.isPending;

  const memberError =
    membersQuery.error?.message ??
    (membersQuery.data?.success === false
      ? membersQuery.data.message
      : undefined);
  const searchError =
    searchUsersQuery.error?.message ??
    (searchUsersQuery.data?.success === false
      ? searchUsersQuery.data.message
      : undefined);
  const searchResults = searchUsersQuery.data?.success
    ? searchUsersQuery.data.data
    : [];

  const confirmMemberAction = () => {
    if (!houseId || !pendingAction) return;

    const { member } = pendingAction;
    const onSuccess = (response: HouseMemberMutationResponse) => {
      if (response.success) setPendingAction(null);
      reportResponseError(response);
    };
    const mutationOptions = {
      onSuccess,
      onError: reportMutationError,
    };

    if (pendingAction.type === "add") {
      addMember.mutate({ houseId, userId: member.id }, mutationOptions);
    } else if (pendingAction.type === "update") {
      updateMember.mutate(
        { houseId, userId: member.id, isAdmin: pendingAction.isAdmin },
        mutationOptions,
      );
    } else {
      removeMember.mutate({ houseId, userId: member.id }, mutationOptions);
    }
  };

  const confirmationTitle =
    pendingAction?.type === "add"
      ? "Add house member?"
      : pendingAction?.type === "update"
        ? pendingAction.isAdmin
          ? "Make house admin?"
          : "Remove admin access?"
        : "Remove house member?";
  const confirmationMessage = pendingAction
    ? pendingAction.type === "add"
      ? `Add ${getUserName(pendingAction.member)} to this house?`
      : pendingAction.type === "update"
        ? pendingAction.isAdmin
          ? `Make ${getUserName(pendingAction.member)} an admin of this house?`
          : `Remove admin access from ${getUserName(pendingAction.member)}?`
        : `Remove ${getUserName(pendingAction.member)} from this house?`
    : "";
  const confirmationButtonTitle =
    pendingAction?.type === "add"
      ? "Add member"
      : pendingAction?.type === "update"
        ? "Update role"
        : "Remove member";

  const renderMemberCard = (
    member: HouseMemberProfile,
    allowManagement: boolean,
  ) => {
    const isHouseAdmin = member.isAdmin;
    const name = getUserName(member);

    return (
      <View
        key={member.id}
        style={{
          backgroundColor: theme.colors.secondary,
          borderColor: theme.colors.greyOutline,
          borderRadius: 18,
          borderWidth: 1,
          gap: 12,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              alignItems: "center",
              backgroundColor: theme.colors.primary,
              borderRadius: 24,
              height: 48,
              justifyContent: "center",
              width: 48,
            }}
          >
            <Feather
              name={isHouseAdmin ? "shield" : "user"}
              size={21}
              color={theme.colors.success}
            />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={{ fontFamily: "Lexend_600SemiBold", fontSize: 16 }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {member.emailAddress ? (
              <Text
                style={{ color: theme.colors.grey2, fontSize: 12 }}
                numberOfLines={1}
              >
                {member.emailAddress}
              </Text>
            ) : null}
          </View>
          <View
            style={{
              backgroundColor: theme.colors.primary,
              borderColor: isHouseAdmin
                ? theme.colors.success
                : theme.colors.greyOutline,
              borderRadius: 99,
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                color: isHouseAdmin ? theme.colors.success : theme.colors.grey2,
                fontFamily: "Lexend_500Medium",
                fontSize: 11,
              }}
            >
              {isHouseAdmin ? "Admin" : "Member"}
            </Text>
          </View>
        </View>

        {allowManagement ? (
          <View
            style={{
              borderTopColor: theme.colors.greyOutline,
              borderTopWidth: 1,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 4,
              justifyContent: "flex-end",
              paddingTop: 8,
            }}
          >
            <Button
              type="clear"
              size="sm"
              disabled={isMutating}
              title={isHouseAdmin ? "Remove admin" : "Make admin"}
              titleStyle={{
                color: theme.colors.success,
                fontFamily: "Lexend_500Medium",
                fontSize: 12,
              }}
              onPress={() =>
                setPendingAction({
                  type: "update",
                  member,
                  isAdmin: !isHouseAdmin,
                })
              }
            />
            <Button
              type="clear"
              size="sm"
              disabled={isMutating}
              title="Remove member"
              titleStyle={{
                color: theme.colors.error,
                fontFamily: "Lexend_500Medium",
                fontSize: 12,
              }}
              onPress={() => setPendingAction({ type: "remove", member })}
            />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.primary }}
        contentContainerStyle={{ padding: 16, paddingBottom: 132, gap: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isAdmin ? (
          <View style={{ gap: 10 }}>
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  color: theme.colors.grey2,
                  fontFamily: "Lexend_600SemiBold",
                  fontSize: 12,
                  letterSpacing: 1.2,
                }}
              >
                ADD HOUSE MEMBERS
              </Text>
              <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                Search by name, email, or username.
              </Text>
            </View>
            <Input
              accessibilityLabel="Search users to add to this house"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={
                <Feather name="search" size={18} color={theme.colors.grey2} />
              }
              onChangeText={setSearchText}
              onSubmitEditing={() => setSearchQuery(searchText.trim())}
              placeholder="Search users"
              placeholderTextColor={theme.colors.grey3}
              returnKeyType="search"
              value={searchText}
              containerStyle={{ paddingHorizontal: 0, paddingBottom: 0 }}
              inputContainerStyle={{
                backgroundColor: theme.colors.secondary,
                borderBottomWidth: 1,
                borderWidth: 1,
                borderColor: theme.colors.grey5,
                borderRadius: 14,
                paddingHorizontal: 12,
              }}
              inputStyle={{
                color: theme.colors.black,
                fontFamily: "Lexend_400Regular",
                fontSize: 16,
              }}
            />

            {searchQuery.length > 0 ? (
              <View style={{ gap: 10 }}>
                <Text
                  style={{
                    color: theme.colors.grey2,
                    fontFamily: "Lexend_600SemiBold",
                    fontSize: 12,
                    letterSpacing: 1.2,
                  }}
                >
                  SEARCH RESULTS
                </Text>
                {searchUsersQuery.isLoading ? (
                  <SearchResultsSkeleton />
                ) : searchError ? (
                  <Text style={{ color: theme.colors.error }}>
                    {searchError}
                  </Text>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <View
                      key={result.id}
                      style={{
                        alignItems: "center",
                        backgroundColor: theme.colors.secondary,
                        borderWidth: 1,
                        borderColor: theme.colors.grey5,
                        borderRadius: 14,
                        flexDirection: "row",
                        gap: 12,
                        padding: 14,
                      }}
                    >
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text
                          style={{ fontFamily: "Lexend_500Medium" }}
                          numberOfLines={1}
                        >
                          {getUserName(result)}
                        </Text>
                        {result.emailAddress ? (
                          <Text
                            style={{ color: theme.colors.grey2, fontSize: 12 }}
                            numberOfLines={1}
                          >
                            {result.emailAddress}
                          </Text>
                        ) : null}
                      </View>
                      {result.isMember ? (
                        <Text
                          style={{
                            color: theme.colors.grey2,
                            fontFamily: "Lexend_500Medium",
                            fontSize: 11,
                          }}
                        >
                          Already added
                        </Text>
                      ) : (
                        <Button
                          size="sm"
                          loading={addMember.isPending}
                          disabled={isMutating}
                          onPress={() =>
                            setPendingAction({ type: "add", member: result })
                          }
                        >
                          Add
                        </Button>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={{ color: theme.colors.grey2, fontSize: 13 }}>
                    No users found.
                  </Text>
                )}
                <Text style={{ color: theme.colors.grey3, fontSize: 11 }}>
                  Showing up to 20 matching users.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: theme.colors.grey2,
                fontFamily: "Lexend_600SemiBold",
                fontSize: 12,
                letterSpacing: 1.2,
              }}
            >
              HOUSE MEMBERS
            </Text>
            {houseQuery.isLoading || membersQuery.isLoading ? (
              <LoadingSkeleton height={12} width={20} borderRadius={6} />
            ) : (
              <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                {members.length}
              </Text>
            )}
          </View>

          {houseQuery.isLoading || membersQuery.isLoading ? (
            <HouseMemberListSkeleton count={3} />
          ) : !houseId ? (
            <Text style={{ color: theme.colors.grey2, fontSize: 13 }}>
              Connect to a house to view its members.
            </Text>
          ) : memberError ? (
            <Text style={{ color: theme.colors.error }}>{memberError}</Text>
          ) : members.length > 0 ? (
            members.map((member) => renderMemberCard(member, isAdmin))
          ) : (
            <Text style={{ color: theme.colors.grey2, fontSize: 13 }}>
              No house members found.
            </Text>
          )}
        </View>
      </ScrollView>

      <BottomSheet
        isVisible={Boolean(pendingAction)}
        onBackdropPress={() => {
          if (!isMutating) setPendingAction(null);
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.secondary,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            gap: 14,
            padding: 20,
          }}
        >
          <SheetHeader
            title={confirmationTitle}
            onClose={() => setPendingAction(null)}
            closeLabel="Close member confirmation"
            disabled={isMutating}
          />
          <Text style={{ color: theme.colors.grey2 }}>
            {confirmationMessage}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            <Button
              type="clear"
              disabled={isMutating}
              onPress={() => setPendingAction(null)}
            >
              Cancel
            </Button>
            <Button
              color={pendingAction?.type === "remove" ? "error" : "success"}
              disabled={isMutating}
              loading={isMutating}
              onPress={confirmMemberAction}
            >
              {confirmationButtonTitle}
            </Button>
          </View>
        </View>
      </BottomSheet>
    </>
  );
};

export default HouseMembers;
