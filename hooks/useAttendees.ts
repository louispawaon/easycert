import { useEffect, useState } from "react";
import { getLocalStorageItem } from "@/lib/utils";
import { addEventListener, removeEventListener } from "@/lib/utils";;

export function useAttendees() {
    const [attendees, setAttendees] = useState<string[]>([]);
    
    useEffect(() => {
      const savedAttendeeList = getLocalStorageItem('attendeeList');
      if (savedAttendeeList) {
        const names = savedAttendeeList.split('\n').filter(line => line.trim());
        setAttendees(names);
      }
  
      const handleAttendeeUpdate = (event: CustomEvent) => setAttendees(event.detail.attendees);
      const handleAttendeeClear = () => setAttendees([]);
  
      addEventListener('attendee-list-uploaded', handleAttendeeUpdate as EventListener);
      addEventListener('attendee-list-updated', handleAttendeeUpdate as EventListener);
      addEventListener('attendee-list-cleared', handleAttendeeClear);
  
      return () => {
        removeEventListener('attendee-list-uploaded', handleAttendeeUpdate as EventListener);
        removeEventListener('attendee-list-updated', handleAttendeeUpdate as EventListener);
        removeEventListener('attendee-list-cleared', handleAttendeeClear);
      };
    }, []);
  
    return { attendees, setAttendees };
}