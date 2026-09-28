// const getDayRange = (dateString) => {
//   const date = new Date(dateString);

//   if (isNaN(date.getTime())) {
//     return null;
//   }

//   const start = new Date(date);
//   start.setHours(0, 0, 0, 0);

//   const end = new Date(date);
//   end.setHours(23, 59, 59, 999);

//   return {
//     start,
//     end
//   };
// };

// module.exports = {
//   getDayRange
// };

const getDayRange = (dateString) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return null;
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end
  };
};

module.exports = {
  getDayRange
};