export function getToken(){
  return localStorage.getItem("token");
}

export function getRole(){
  return localStorage.getItem("role");
}

export function getClubId(){
  return localStorage.getItem("clubId");
}

export function getClubName(){
  return localStorage.getItem("clubName");
}

export function getEventId(){
  return localStorage.getItem("eventId");
}

export function getEventName(){
  return localStorage.getItem("eventName");
}

export function getServiceType(){
  return localStorage.getItem("serviceType");
}

export function isEventActive(){
  return localStorage.getItem("isEventActive") === "true";
}

export function logout(){
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("clubId");
  localStorage.removeItem("clubName");
  localStorage.removeItem("eventId");
  localStorage.removeItem("eventName");
  localStorage.removeItem("serviceType");
  localStorage.removeItem("isEventActive");
}
