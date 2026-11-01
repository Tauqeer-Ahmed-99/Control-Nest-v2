import React from "react";
import { useWindowDimensions, View } from "react-native";
import MessageContainer from "./message-container";

function chunkArray<T>(array: T[], chunkSize: number) {
  const chunkedArray = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunkedArray.push(chunk);
  }
  return chunkedArray;
}

interface GridProps<T> {
  items: T[];
  renderItem: (item: T, index: number, array: T[]) => React.ReactNode;
  rowSize?: number;
  rowGap?: number;
  noDataMessage?: string;
}

function Grid<T>({
  items,
  renderItem,
  rowSize,
  rowGap,
  noDataMessage,
}: GridProps<T>) {
  const { width, fontScale } = useWindowDimensions();
  const data = chunkArray(
    items ?? [],
    rowSize ?? (width < 360 || fontScale > 1.2 ? 1 : 2),
  );

  return (
    <View>
      {data && data.length > 0 ? (
        data.map((chunk, index) => (
          <View
            key={index}
            style={{
              marginBottom: rowGap ?? 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {chunk.map((item, index, arr) => (
              <React.Fragment key={index}>
                {renderItem(item, index, arr)}
              </React.Fragment>
            ))}
          </View>
        ))
      ) : (
        <MessageContainer message={noDataMessage ?? "Data not available."} />
      )}
    </View>
  );
}

export default Grid;
