
//tuần, ngày, tháng, năm
export const LONG_DATE_FORMAT: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  //ngày, tháng, năm
  export const SHORT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  export const TIME_FORMAT: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    
  };