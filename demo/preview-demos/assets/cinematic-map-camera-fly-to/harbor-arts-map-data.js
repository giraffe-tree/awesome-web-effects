export const harborArtsMap = Object.freeze({
  id: 'harbor-arts-district-v1',
  coordinateSystem: 'local-planar-meter-like-units',
  extent: Object.freeze({ width: 1000, height: 640 }),
  overviewCamera: Object.freeze({ center: Object.freeze([500, 320]), zoom: 1, pitch: 0, bearing: 0 }),
  coastline: Object.freeze([
    Object.freeze([0, 0]), Object.freeze([1000, 0]), Object.freeze([1000, 128]),
    Object.freeze([914, 144]), Object.freeze([858, 184]), Object.freeze([826, 242]),
    Object.freeze([858, 302]), Object.freeze([818, 354]), Object.freeze([730, 382]),
    Object.freeze([674, 438]), Object.freeze([612, 426]), Object.freeze([548, 486]),
    Object.freeze([458, 502]), Object.freeze([402, 556]), Object.freeze([374, 640]),
    Object.freeze([0, 640])
  ]),
  districts: Object.freeze([
    Object.freeze({
      id: 'old-quay', name: 'OLD QUAY',
      polygon: Object.freeze([[240, 206], [506, 188], [548, 352], [430, 458], [226, 430]].map(Object.freeze))
    }),
    Object.freeze({
      id: 'salt-market', name: 'SALT MARKET',
      polygon: Object.freeze([[506, 188], [748, 174], [796, 326], [706, 382], [548, 352]].map(Object.freeze))
    }),
    Object.freeze({
      id: 'north-works', name: 'NORTH WORKS',
      polygon: Object.freeze([[182, 64], [626, 62], [748, 174], [506, 188], [240, 206]].map(Object.freeze))
    })
  ]),
  roads: Object.freeze([
    Object.freeze({ id: 'quay-road', name: 'QUAY ROAD', kind: 'arterial', points: Object.freeze([[86, 448], [226, 430], [430, 458], [548, 486], [674, 438], [730, 382]].map(Object.freeze)) }),
    Object.freeze({ id: 'foundry-avenue', name: 'FOUNDRY AVE', kind: 'arterial', points: Object.freeze([[104, 252], [240, 206], [506, 188], [748, 174], [914, 144]].map(Object.freeze)) }),
    Object.freeze({ id: 'meridian-street', name: 'MERIDIAN ST', kind: 'arterial', points: Object.freeze([[386, 72], [398, 164], [414, 278], [430, 458], [458, 502], [474, 616]].map(Object.freeze)) }),
    Object.freeze({ id: 'salt-lane', name: 'SALT LANE', kind: 'local', points: Object.freeze([[520, 120], [536, 242], [548, 352], [612, 426]].map(Object.freeze)) }),
    Object.freeze({ id: 'archive-row', name: 'ARCHIVE ROW', kind: 'local', points: Object.freeze([[214, 326], [350, 302], [536, 242], [710, 236], [826, 242]].map(Object.freeze)) }),
    Object.freeze({ id: 'dock-seven', name: 'DOCK 7', kind: 'local', points: Object.freeze([[624, 92], [650, 188], [684, 292], [730, 382]].map(Object.freeze)) }),
    Object.freeze({ id: 'lantern-way', name: 'LANTERN WAY', kind: 'local', points: Object.freeze([[126, 370], [288, 360], [430, 376], [590, 340], [796, 326]].map(Object.freeze)) }),
    Object.freeze({ id: 'ridge-cut', name: 'RIDGE CUT', kind: 'local', points: Object.freeze([[182, 64], [254, 154], [288, 360], [318, 520]].map(Object.freeze)) }),
    Object.freeze({ id: 'tide-steps', name: 'TIDE STEPS', kind: 'footway', points: Object.freeze([[548, 352], [604, 366], [674, 438], [730, 382], [818, 354]].map(Object.freeze)) })
  ]),
  places: Object.freeze([
    Object.freeze({
      id: 'archive-hall', name: 'Archive Hall', shortName: 'ARCHIVE', type: 'Exhibition', point: Object.freeze([350, 302]),
      camera: Object.freeze({ center: Object.freeze([350, 302]), zoom: 2.15, pitch: 0.2, bearing: 0.1 })
    }),
    Object.freeze({
      id: 'salt-market', name: 'Salt Market', shortName: 'MARKET', type: 'Night market', point: Object.freeze([590, 340]),
      camera: Object.freeze({ center: Object.freeze([590, 340]), zoom: 2.35, pitch: 0.26, bearing: -0.12 })
    }),
    Object.freeze({
      id: 'pier-seven', name: 'Pier Seven', shortName: 'PIER 7', type: 'Live stage', point: Object.freeze([730, 382]),
      camera: Object.freeze({ center: Object.freeze([730, 382]), zoom: 2.6, pitch: 0.32, bearing: -0.2 })
    })
  ])
});
