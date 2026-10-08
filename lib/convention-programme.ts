export type ProgrammeItem = {
  title: string;
  time: string;
  start: string;
  end: string;
  anchor?: string;
};

export type ConventionDay = {
  key: string;
  label: string;
  date: string;
  start: string;
  end: string;
  items: ProgrammeItem[];
};

export const conventionProgramme: ConventionDay[] = [
  {
    key: "thursday",
    label: "DAY 1",
    date: "2026-10-08",
    start: "16:00",
    end: "18:30",
    items: [
      { title: "Intercessory Prayers", time: "4:00pm – 4:25pm", start: "16:00", end: "16:25", anchor: "Brother Godbless Kemefa" },
      { title: "Opening Prayers", time: "4:25pm – 4:30pm", start: "16:25", end: "16:30", anchor: "Sister Ngozi Okoh" },
      { title: "Praises", time: "4:30pm – 4:50pm", start: "16:30", end: "16:50", anchor: "Praise Team" },
      { title: "Welcome address", time: "4:50pm – 4:55pm", start: "16:50", end: "16:55", anchor: "Sister Favour Okafor" },
      { title: "Welcoming", time: "4:55pm – 5:00pm", start: "16:55", end: "17:00", anchor: "Brother Victor Agezeh" },
      { title: "Convention Anthem", time: "5:00pm – 5:05pm", start: "17:00", end: "17:05", anchor: "Pastor Joshua Andy" },
      { title: "Know your leaders", time: "5:05pm – 5:20pm", start: "17:05", end: "17:20", anchor: "Sister Ebimorbere Bobomi" },
      { title: "Choir Ministration", time: "5:20pm – 5:30pm", start: "17:20", end: "17:30", anchor: "National Youth Choir" },
      { title: "The Word/Prayers", time: "5:30pm – 6:20pm", start: "17:30", end: "18:20", anchor: "Brother Godbless Kemefa" },
      { title: "Offering/Announcement", time: "6:20pm – 6:30pm", start: "18:20", end: "18:30", anchor: "Brother Niyi Amuda" },
      { title: "Closing", time: "6:30pm", start: "18:30", end: "18:30" }
    ]
  },

  {
    key: "friday",
    label: "DAY 2",
    date: "2026-10-09",
    start: "20:30",
    end: "28:00",
    items: [
      { title: "Intercessory Prayers", time: "8:30pm – 9:00pm", start: "20:30", end: "21:00", anchor: "Brother Godbless Kemefa" },
      { title: "Opening Prayers", time: "9:00pm – 9:10pm", start: "21:00", end: "21:10", anchor: "Sister Divinefavour Bobomi" },
      { title: "Worship", time: "9:10pm – 9:35pm", start: "21:10", end: "21:35", anchor: "Brother Emma Edafe" },
      { title: "Welcoming", time: "9:35pm – 9:45pm", start: "21:35", end: "21:45", anchor: "Brother Ifeanyi Okoro" },
      { title: "Convention anthem", time: "9:45pm – 9:55pm", start: "21:45", end: "21:55", anchor: "Pastor Joshua Andy" },
      { title: "Praises", time: "9:55pm – 10:20pm", start: "21:55", end: "22:20", anchor: "Praise team" },
      { title: "Bible quiz", time: "10:20pm – 10:50pm", start: "22:20", end: "22:50", anchor: "Brother Victor Agezeh" },
      { title: "Ministration", time: "10:50pm – 11:15pm", start: "22:50", end: "23:15", anchor: "Invited guest" },
      { title: "Ministration", time: "11:15pm – 11:30pm", start: "23:15", end: "23:30", anchor: "Sister Ebimorbere Bobomi" },
      { title: "Drama", time: "11:30pm – 11:50pm", start: "23:30", end: "23:50", anchor: "Drama team" },
      { title: "Choir ministration", time: "11:50pm – 12:00am", start: "23:50", end: "24:00", anchor: "National youth choir" },
      { title: "Prayers", time: "12:00am – 1:00am", start: "24:00", end: "25:00", anchor: "Brother Godbless Kemefa" },
      { title: "Ministration", time: "1:00am – 1:20am", start: "25:00", end: "25:20", anchor: "Native air" },
      { title: "Word game", time: "1:20am – 1:40am", start: "25:20", end: "25:40", anchor: "Sister Ebimorbere Bobomi" },
      { title: "Ministration", time: "1:40am – 2:05am", start: "25:40", end: "26:05", anchor: "Invited guest" },
      { title: "Singing game", time: "2:05am – 2:25am", start: "26:05", end: "26:25", anchor: "Pastor Joshua Andy" },
      { title: "Ministration", time: "2:25am – 2:50am", start: "26:25", end: "26:50", anchor: "Invited guest" },
      { title: "Hymn", time: "2:50am – 3:00am", start: "26:50", end: "27:00", anchor: "Pastor Joshua Andy" },
      { title: "Ministration", time: "3:00am – 3:25am", start: "27:00", end: "27:25", anchor: "Invited Guest" },
      { title: "Offering/Announcement", time: "3:25am – 4:00am", start: "27:25", end: "28:00", anchor: "Brother Niyi Amuda" },
      { title: "Closing", time: "4:00am", start: "28:00", end: "28:00" }
    ]
  },

  {
    key: "sunday",
    label: "DAY 3",
    date: "2026-10-11",
    start: "07:30",
    end: "12:30",
    items: [
      { title: "Breakthrough Prayers", time: "7:30am – 7:55am", start: "07:30", end: "07:55", anchor: "Brother Victor Agezeh" },
      { title: "Class arrangement", time: "7:55am – 8:00am", start: "07:55", end: "08:00" },
      { title: "Sunday School", time: "8:00am – 8:40am", start: "08:00", end: "08:40", anchor: "Sunday School teachers" },
      { title: "Sunday School Summary", time: "8:40am – 8:50am", start: "08:40", end: "08:50" },
      { title: "Convention Anthem", time: "8:50am – 8:55am", start: "08:50", end: "08:55", anchor: "Pastor Joshua Andy" },
      { title: "Worship", time: "8:55am – 9:10am", start: "08:55", end: "09:10", anchor: "Worship team" },
      { title: "Praises", time: "9:10am – 9:35am", start: "09:10", end: "09:35", anchor: "Praise team" },
      { title: "Church Activities", time: "9:35am – 10:10am", start: "09:35", end: "10:10" },
      { title: "Games/Awards", time: "10:10am – 10:50am", start: "10:10", end: "10:50", anchor: "Brother Niyi Amuda" },
      { title: "Choir ministration", time: "10:50am – 11:00am", start: "10:50", end: "11:00", anchor: "National Youth Choir" },
      { title: "The Word/Prayers", time: "11:00am – 12:00pm", start: "11:00", end: "12:00", anchor: "Pastor Aniefiok Udosen" },
      { title: "Thanksgiving", time: "12:00pm – 12:20pm", start: "12:00", end: "12:20" },
      { title: "Airtime giveaway/closing", time: "12:20pm – 12:30pm", start: "12:20", end: "12:30" }
    ]
  }
];
