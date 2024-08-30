import { FORMAT_DATE } from "../config/constants";
import { convertTimeToMinutes } from "../helper/helper";

export const checkSchedule = (
  startDate: Date,
  endDate: Date,
  duration: number,
  startTime: string,
  endTime: string
) => {
  let min = convertTimeToMinutes(startTime);

  let EventstartDate = new Date(startDate);
  let [hours, minutes] = startTime.split(":").map(Number);
  let EventendDate = new Date(endDate);
  EventstartDate = new Date(
    EventstartDate.setUTCHours(hours, minutes, 0, 0)
  );
  endDate = new Date(endDate)
  startDate = new Date(startDate)
  EventendDate = new Date(
    EventendDate.setUTCHours(hours + duration, minutes, 0, 0)
  );
  // Define a function to convert time strings to minutes since midnight
  const pipeline = [
    {
      $addFields: {
        startTimeParts: { $split: ["$startTime", ":"] },
        endTimeParts: { $split: ["$endTime", ":"] },
        minutesA: {
          $add: [
            { $multiply: [{ $toInt: { $substrCP: [startTime, 0, 2] } }, 60] },
            { $toInt: { $substrCP: [startTime, 3, 2] } },
          ],
        },
        minutesB: {
          $add: [
            { $multiply: [{ $toInt: { $substrCP: [endTime, 0, 2] } }, 60] },
            { $toInt: { $substrCP: [endTime, 3, 2] } },
          ],
        },
        endDate: {
          $dateFromString: {
            dateString: {
              $concat: [
                {
                  $dateToString: {
                    format: FORMAT_DATE.DATE,
                    date: "$endDate",
                  },
                },
                "T",
                "$startTime",
                FORMAT_DATE.TIME,
              ],
            },
            format: FORMAT_DATE.DATE_TIME,
          },
        },
        startDate: {
          $dateFromString: {
            dateString: {
              $concat: [
                {
                  $dateToString: {
                    format: FORMAT_DATE.DATE,
                    date: "$startDate",
                  },
                },
                "T",
                "$startTime",
                FORMAT_DATE.TIME,
              ],
            },
            format: FORMAT_DATE.DATE_TIME,
          },
        },
      },
    },
    {
      $addFields: {
        minutesC: {
          $add: [
            {
              $multiply: [
                { $toInt: { $arrayElemAt: ["$startTimeParts", 0] } },
                60,
              ],
            },
            { $toInt: { $arrayElemAt: ["$startTimeParts", 1] } },
          ],
        },
        minutesD: {
          $add: [
            {
              $multiply: [
                { $toInt: { $arrayElemAt: ["$endTimeParts", 0] } },
                60,
              ],
            },
            { $toInt: { $arrayElemAt: ["$endTimeParts", 1] } },
          ],
        },
        endDate: {
          $add: [
            { $toDate: "$endDate" }, // Convert UTC date to ISODate
            { $multiply: ["$duration", 3600000] }, // Convert hours to milliseconds
          ],
        },
      },
    },
    {
      $addFields: {
        rangeCrossesMidnight: {
          $cond: [{ $lt: ["$minutesC", "$minutesD"] }, false, true],
        },

      },
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { startDate: { $lte: EventstartDate } },
              { endDate: { $gt: EventstartDate } },
            ],
          },
          {
            $and: [
              { startDate: { $lt: EventendDate } },
              { endDate: { $gte: EventendDate } },
            ],
          },
          {
            $and: [
              { startDate: { $gte: EventstartDate } },
              { endDate: { $lte: EventendDate } },
            ],
          },
        ],
      },
    },
    {
      $addFields: {
        isInRange: {
          $or: [
            // Case where neither range crosses midnight
            {
              $and: [
                { $lte: ["$minutesA", "$minutesB"] },
                { $lte: ["$minutesC", "$minutesD"] },
                {
                  "$or": [
                    { "$and": [{ "$gte": ["$minutesC", "$minutesA"] }, { $lt: ["$minutesC", "$minutesB"] }] },
                    { "$and": [{ "$gt": ["$minutesD", "$minutesA"] }, { $lte: ["$minutesD", "$minutesB"] }] },
                    { "$and": [{ "$lte": ["$minutesA", "$minutesC"] }, { $gte: ["$minutesB", "$minutesD"] }] },
                    { "$and": [{ "$lt": ["$minutesA", "$minutesD"] }, { $gt: ["$minutesB", "$minutesC"] }] }
                  ]
                }
              ]
            },     
            // Case where user's range crosses midnight
            {
              $and: [
                { $gt: ["$minutesA", "$minutesB"] },
                {
                  $or: [
                    { $gte: ["$minutesC", "$minutesA"] },
                    { $lt: ["$minutesC", "$minutesB"] },
                    { $gt: ["$minutesD", "$minutesA"] },
                    { $lt: ["$minutesD", "$minutesB"] },
                    { $and: [{ $lte: ["$minutesA", "$minutesC"] }, { $gte: ["$minutesB", "$minutesD"] }] }
                  ]
                }
              ]
            },
            // Case db  where provided range crosses midnight
            {
              $and: [
                { $lte: ["$minutesA", "$minutesB"] },
                { $gt: ["$minutesC", "$minutesD"] },
                {
                  $or: [
                    { $gte: ["$minutesA", "$minutesC"] },
                    { $lt: ["$minutesA", "$minutesD"] },
                    { $gt: ["$minutesB", "$minutesC"] },
                    { $lt: ["$minutesB", "$minutesD"] },
                  ]
                }
              ]
            },
            // Case where both ranges cross midnight
            {
              $and: [
                { $gt: ["$minutesA", "$minutesB"] },
                { $gt: ["$minutesC", "$minutesD"] },
                {
                  $or: [
                    { $gte: ["$minutesC", "$minutesA"] },
                    { $lt: ["$minutesC", "$minutesB"] },
                    { $gt: ["$minutesD", "$minutesA"] },
                    { $lt: ["$minutesD", "$minutesB"] },
                    { $and: [{ $lte: ["$minutesA", "$minutesC"] }, { $gte: ["$minutesB", "$minutesD"] }] }
                  ]
                }
              ]
            }
          ]
        }
      }
    }
  ];
 
  return pipeline;
};