/* Homelab picker. Side first, then smaller layers, then one build. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LabWizard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var FLAVORS = {
    win: {
      name: 'Windows 11 Home',
      build: 'Everyday Windows desk',
      plain: 'The normal PC. A menu, a store, and the games and photo apps people already know.',
      why: 'Windows 11 Home is the outside of the doll. You sit at it. New games expect it. Photo and video apps from the store install without a fight.',
      good: [
        'New games, including many online games that check for cheats.',
        'Photo editing in Lightroom, Photoshop, or the Photos app.',
        'Video editing in DaVinci Resolve or Premiere.',
        'School, mail, and the web.'
      ],
      poor: [
        'A closet box that must stay up for the whole house. Updates can restart Windows.',
        'Many separate little computers inside one machine.'
      ],
      first: [
        'Finish Windows Update before you install your tools.',
        'Put photos and videos on a second disk. Leave the first disk for Windows.',
        'Turn on File History, or copy pictures to a second drive once a week. One disk is not a backup.'
      ],
      next: 'The next doll is Windows 11 Pro if you want Remote Desktop, stronger disk locks, or one practice virtual computer.'
    },
    winpro: {
      name: 'Windows 11 Pro',
      build: 'Windows Pro workbench',
      plain: 'The same Windows desk, with the locks and remote tools a small lab actually uses.',
      why: 'Pro is the layer under Home. You still get games and normal apps. You also get BitLocker, Remote Desktop, and Hyper-V, which is one or two practice computers inside this PC.',
      good: [
        'Everything Home does: games, photos, video, school.',
        'Opening this PC from another computer in the house.',
        'Locking the disk if the computer is stolen.',
        'One practice virtual computer for trying Linux without erasing Windows.'
      ],
      poor: [
        'A big always-on house server. Hyper-V is a practice room, not a building full of guests.',
        'Leaving the PC on a public port. Remote Desktop stays inside the house.'
      ],
      first: [
        'Install Pro, then turn on BitLocker only after you write the recovery key on paper.',
        'Turn on Hyper-V only if you have 16 GB of memory or more. Give the practice computer 4 GB, not half the PC.',
        'Use Remote Desktop from inside the house. Do not forward it to the internet.'
      ],
      next: 'The next doll is a separate Linux closet box when house apps feel cramped inside Windows.'
    },
    mint: {
      name: 'Linux Mint',
      build: 'Friendly Linux desk',
      plain: 'A free Linux desk with a menu and a taskbar. It feels close to Windows.',
      why: 'Mint is the first Linux doll. You can learn files, the terminal, and Docker without throwing away a familiar screen.',
      good: [
        'A daily computer for the web, school, and files.',
        'Free photo tools: digiKam, Darktable, and GIMP.',
        'Free video tools: Kdenlive and Shotcut.',
        'Many Steam games. Indie and older games do well.'
      ],
      poor: [
        'Brand-new online games that require anti-cheat. A lot of those still want Windows.',
        'A tiny always-on appliance.',
        'Splitting one computer into many virtual computers. That is Proxmox, and it wants more memory.'
      ],
      first: [
        'Copy your files somewhere else before you install Mint over a disk.',
        'Learn the file manager first. Then add one Docker app, not ten.',
        'Keep a second copy of photos.'
      ],
      next: 'The next doll is Omarchy, after you can fix a broken update, or Proxmox on a second box when the house needs its own computer.'
    },
    bazzite: {
      name: 'Bazzite',
      build: 'Linux game desk',
      plain: 'A Linux system already set up for Steam, controllers, and graphics cards.',
      why: 'Bazzite is the game doll inside Linux. Universal Blue builds it so Steam and the graphics drivers are part of the plan. You sit at it and play. New anti-cheat games can still refuse to run. Those stay on Windows.',
      good: [
        'A computer you sit at and play on.',
        'Steam, plus many older and indie games.',
        'An NVIDIA card or an AMD card, when you download the matching image.',
        'A normal desk for the web and files between games.'
      ],
      poor: [
        'A closet full of house apps. Movies, backups, and Home Assistant belong on a second computer.',
        'The only copy of family photos.',
        'Brand-new anti-cheat games that only trust Windows.',
        'A first lesson in every Linux command. Bazzite stays in a fixed shape so the game desk does not break.'
      ],
      first: [
        'Download the Desktop image. Pick the NVIDIA image only if the card is NVIDIA.',
        'Copy your files off the disk before you install.',
        'Open Steam after the first boot. That is the point of this doll.'
      ],
      next: 'The next doll is a separate Ubuntu or Proxmox box for movies, backups, and Home Assistant. This computer stays the game desk.'
    },
    omarchy: {
      name: 'Omarchy',
      build: 'Keyboard Linux desk',
      plain: 'Arch Linux already dressed as a keyboard-first desk.',
      why: 'Omarchy is a deeper Linux doll. Arch updates in small bites all the time. The windows sit in a grid and the keyboard drives them. It looks sharp. You are the person who fixes it when an update misbehaves.',
      good: [
        'A daily desk for someone who already fixes Linux problems.',
        'The same free photo and video tools as Mint.',
        'Coding and notes at keyboard speed.',
        'Docker, as a side experiment.'
      ],
      poor: [
        'Your first Linux. Start with Mint.',
        'A closet server. A pretty desk is the wrong shape for a box nobody sits at.',
        'New anti-cheat games. The fancy screen can also fight with normal games.'
      ],
      first: [
        'Read the install notes all the way through before you erase a disk.',
        'Keep a second computer nearby the first week.',
        'Do not put the only copy of family photos here.'
      ],
      next: 'The next doll is a closet computer running Proxmox or Ubuntu. This desk stays the desk.'
    },
    proxmox: {
      name: 'Proxmox',
      build: 'House brain',
      plain: 'A boss computer. You drive it from a web page. It runs many smaller computers inside one real one.',
      why: 'Proxmox is the deep server doll. One guest can be Home Assistant. One can hold movies. One can be a sandbox. If one breaks, the others can keep going. Proxmox is free to use at home. The paid plan is for companies that want a support contract.',
      good: [
        'A closet computer with 32 GB of memory or more.',
        'Snapshots, so a bad experiment can be undone.',
        'Home Assistant, files, and a media server side by side.',
        'A later Windows guest, if memory is left. Games are still happier on a real Windows PC.'
      ],
      poor: [
        '8 or 16 GB of memory. The boss plus the guests will not fit.',
        'The computer you play new games on.',
        'Editing photos in the Proxmox web page. Edit on a desk. Let Proxmox store and serve.'
      ],
      first: [
        'Put Proxmox on its own SSD. Put photos and movies on a different disk.',
        'Leave at least 4 GB of memory for Proxmox itself.',
        'Open the web page only at home. Do not publish it on the internet.'
      ],
      next: 'The next doll is a storage guest such as TrueNAS when the movie or photo pile is the real job, or one guest that owns the graphics card for AI.'
    },
    alpine: {
      name: 'Alpine Linux',
      build: 'Tiny helper',
      plain: 'A very small system for one always-on job.',
      why: 'Alpine is the smallest doll. It uses little memory and little disk. There is no photo desk inside it. You type commands. Pick it when the box is small, you already know Linux, and the job is truly one job.',
      good: [
        'A small always-on helper.',
        'Computers with about 8 GB of memory.',
        'People who can read an error and fix a config file.'
      ],
      poor: [
        'Photo editing, video editing, and games.',
        'Your first Linux.',
        'A pile of random Docker apps. Many of those apps assume Ubuntu or Debian.',
        'Big NVIDIA AI. You would be the mechanic.'
      ],
      first: [
        'Write the one job on paper. A second job means this was the wrong layer.',
        'Keep another computer you can type from.',
        'Update on purpose. Do not forget it for a year.'
      ],
      next: 'The next doll is Ubuntu Server when you want the usual homelab apps without a fight.'
    },
    ubuntu: {
      name: 'Ubuntu Server or Debian',
      build: 'Closet Linux server',
      plain: 'One Linux system that stays on and runs house apps. No fancy desk.',
      why: 'This is the middle server doll. You add Docker and run files, movies, Home Assistant, or a photo library in containers. It is simpler than Proxmox when you only need one system. Most homelab guides assume Ubuntu or Debian, so you will not fight the instructions.',
      good: [
        'A closet server with about 16 GB of memory.',
        'Several house apps in Docker on one system.',
        'Learning real Linux before you learn virtual machines.',
        'Photo libraries such as Immich, if the disks are big enough.'
      ],
      poor: [
        'New anti-cheat games.',
        'Sitting down to edit a wedding video.',
        'Many fully separate computers with snapshots. That wants 32 GB and Proxmox.'
      ],
      first: [
        'Install Ubuntu Server or Debian. Use SSH keys.',
        'Do not open the admin pages to the public internet.',
        'Add one app. Prove you can open it. Then add the next.',
        'Put the system on an SSD. Put movies and photos on a bigger disk.'
      ],
      next: 'The next doll is Proxmox when you have 32 GB and you want each job in its own little computer.'
    },
    mac: {
      name: 'macOS',
      build: 'Mac desk',
      plain: 'The Mac you already sit at. Photos, video, and a quiet kind of local AI.',
      why: 'A Mac is a finished desk. The screen, trackpad, and backups are the product. On Apple silicon, the graphics are not a separate NVIDIA card. They share the Mac’s memory. That memory is called unified memory.',
      good: [
        'Photos and iCloud, and serious edits in Photos or Lightroom.',
        'Video in Final Cut or DaVinci.',
        'Local chat models through Ollama or MLX, sized to the Mac’s memory.',
        'A beautiful daily computer that also starts a small lab habit.'
      ],
      poor: [
        'NVIDIA video cards. Modern macOS does not use them.',
        'Proxmox on the Mac. The Mac is the desk, not the boss of many PC guests.',
        'Every new PC game. Some have no Mac version.'
      ],
      first: [
        'Turn on Time Machine to a disk that is not inside the Mac.',
        'Keep at least a quarter of the memory free. The graphics borrow the same memory as your apps.',
        'Try one local model only after the Mac feels calm in normal use.'
      ],
      next: 'The next doll is a Mac with more unified memory, or a small Linux box beside this Mac for the house.'
    },
    macmini: {
      name: 'Mac mini as a helper',
      build: 'Always-on Mac',
      plain: 'A Mac that stays on for small house jobs. You still drive it from another screen.',
      why: 'A Mac mini is a quiet closet doll. It can share files, run a few containers, and host a small smart-home helper. It will not become a stack of virtual PCs, and it will not grow an NVIDIA card.',
      good: [
        'Files, Time Machine targets, and a small Docker or OrbStack setup.',
        'Homebridge or a light Home Assistant helper.',
        'Small chat models if the mini has 16 GB of unified memory or more.',
        'A box that sips power and stays quiet.'
      ],
      poor: [
        'A movie fortress with many huge disks and a graphics card for AI video.',
        'Proxmox-style guests.',
        'Editing the family video on the mini while it is also the server. Edit on a desk Mac.'
      ],
      first: [
        'Turn on Remote Login for yourself. Do not expose it to the internet.',
        'Plug the big file disk into the mini. Keep macOS on the internal drive.',
        'Add one house app. Stop there until it has behaved for a week.'
      ],
      next: 'The next doll is a real Linux server when you want Proxmox, a graphics card, or a large movie pile.'
    },
    maclab: {
      name: 'Mac desk plus a lab box',
      build: 'Mac desk and a small lab',
      plain: 'The Mac stays the computer you love. A second, cheaper computer runs the house.',
      why: 'This is two dolls that fit together. The Mac edits photos and video and stays pretty. The lab box stays on, runs Docker or Proxmox, and takes the jobs that would make the Mac feel like a server.',
      good: [
        'Final Cut, Photos, and daily Mac life with no compromise.',
        'A house server that can restart without taking your desk down.',
        'A clear place for movies, backups, and Home Assistant.',
        'A later graphics card, on the lab box, if you want local AI video.'
      ],
      poor: [
        'Trying to make the Mac itself into Proxmox.',
        'Buying a huge GPU for the Mac. Put that money in the lab box.',
        'One disk holding the only copy of both machines’ files.'
      ],
      first: [
        'Leave the Mac as it is. Do not erase it to “make a server.”',
        'Buy or reuse a small PC for the lab. 16 GB runs Ubuntu. 32 GB or more can run Proxmox.',
        'Point Time Machine at a disk on the lab box, and keep a second copy of photos off site if you can.'
      ],
      next: 'When the lab box has 32 GB, move it from Ubuntu to Proxmox. The Mac does not change.'
    }
  };

  var RAM_TEXT = {
    8: '8 GB is one job at a time. A normal desk can work. Do not run several pretend computers. Do not run a big AI model.',
    16: '16 GB is a solid daily computer or a starter closet server. A couple of small house apps can share it. Proxmox with many guests will feel cramped.',
    32: '32 GB is where a real lab starts. Proxmox can hold a few guests. A Windows guest still wants about 8 GB, so do not give every guest a feast.',
    64: '64 GB is a comfortable lab. A heavier guest, Home Assistant, and a media app can all stay up.',
    128: '128 GB is a big lab. Many services can stay up. A large AI model can sit in normal memory, but it is still slow if a graphics card is not doing the work.'
  };

  var MAC_RAM_TEXT = {
    8: '8 GB of unified memory is tight on a modern Mac. The screen and the graphics share it. You can write and browse. A local AI model will push the Mac into swapping, which means it uses the disk as fake memory and feels sticky.',
    16: '16 GB is the calm daily Mac. Photos and a normal edit fit. A small chat model can run, and it shares this same 16 GB with everything else you have open. Close big apps first.',
    24: '24 GB gives photo and video work more air. Mid-size local models become reasonable if you are not exporting a video at the same time.',
    32: '32 GB is a strong Mac for Final Cut and for local models. The graphics still borrow this pool. Leave headroom.',
    64: '64 GB is a serious Apple-silicon workstation. Larger local models fit. NVIDIA-style AI video still belongs on a PC graphics card, not in this pool.',
    128: '128 GB of unified memory is a top Mac. Big local models fit. It is still not a stack of Proxmox guests, and it is still not an NVIDIA video card.'
  };

  var GPU_TEXT = {
    none: {
      label: 'No extra graphics card',
      games: 'Fine for the web and for watching videos. New 3D games will struggle.',
      photos: 'You can sort photos and do light edits. Huge camera files with heavy filters will feel slow.',
      video: 'Short 1080p edits can work. 4K editing will hurt. AI video is not for this computer.',
      models: 'Only very small chat models, about 1 to 3 billion parameters, on the processor. A parameter is one note the model memorized. Answers will be slow. This is practice AI, not a daily assistant.'
    },
    1: {
      label: 'About 1 GB graphics card, or smaller',
      games: 'This is a very old card. It can show the desktop and play very old games. New 3D games will not run well.',
      photos: 'You can look through photos. Heavy filters and huge camera files will feel slow.',
      video: 'Watching a video can work. Editing will hurt. AI video does not fit on 1 GB.',
      models: '1 GB is too small to hold a chat model on the card. A tiny model can still run on the processor, and it will be slow. This is not a daily AI computer.'
    },
    2: {
      label: 'About 2 GB graphics card',
      games: 'Old games at low settings can work. New games will struggle, or they will not start.',
      photos: 'Light photo edits fit. Heavy filters will feel slow.',
      video: 'A short 1080p clip can be tried. 4K editing and AI video do not fit.',
      models: '2 GB cannot hold a useful chat model. A 7-billion-parameter model needs several times this much card memory. A tiny practice model can use the processor instead, and it will be slow.'
    },
    4: {
      label: 'About 3 or 4 GB graphics card',
      games: 'Older games at 1080p can work if you turn the settings down. New games want more card memory.',
      photos: 'Normal photo edits fit. Huge files with many filters will still feel slow.',
      video: '1080p editing can be tried. 4K editing and AI video do not fit.',
      models: 'A tiny chat model can try this card. A 7-billion-parameter model does not fit once the conversation memory is counted. That model wants a bigger card.'
    },
    6: {
      label: 'About 6 GB graphics card',
      games: 'Older games and many current games at 1080p. Turn some settings down.',
      photos: 'Real photo editing is fine.',
      video: '1080p editing is fine. 4K is tight. AI video clips do not fit well.',
      models: 'A 7-billion-parameter chat model, in a smaller 4-bit copy, fits. A 4-bit copy uses less memory and is a little less sharp. A small Whisper hearing model fits. A 14-billion chat model is too big to feel good.'
    },
    8: {
      label: 'About 8 GB graphics card',
      games: '1080p is the sweet spot. Some 1440p if you lower settings.',
      photos: 'Photo editing is comfortable.',
      video: '1080p is comfortable. 4K can work if you edit with small stand-in clips. AI video is still a poor fit.',
      models: '7 to 8 billion parameter models fit well in a 4-bit copy. Older picture models fit. The larger SDXL picture model is tight and slow.'
    },
    12: {
      label: 'About 12 GB graphics card',
      games: '1080p is easy. 1440p is reasonable for many games.',
      photos: 'Heavier photo files are comfortable.',
      video: '4K editing becomes reasonable. Short AI video can start, and it will be slow.',
      models: 'About a 14-billion-parameter chat model fits in a 4-bit copy. Run one heavy job at a time. Do not game and run a model together.'
    },
    16: {
      label: 'About 16 GB graphics card',
      games: '1440p is realistic for many new games.',
      photos: 'Heavy photo work is fine.',
      video: '4K editing is a fair daily job. Some short AI video workflows fit.',
      models: '14-billion chat models fit more comfortably. A 32-billion model is still tight. A 70-billion model does not belong here.'
    },
    24: {
      label: 'About 24 GB graphics card',
      games: 'High settings at 1440p, and 4K in many games.',
      photos: 'The card is not the limit for photos.',
      video: '4K editing is comfortable. Local AI video becomes a real experiment: short clips, not a movie studio.',
      models: 'About a 32-billion-parameter chat model can fit in a 4-bit copy. Picture models fit. A 70-billion model still wants more, or it borrows normal RAM and gets slow.'
    }
  };

  var STORAGE_TEXT = {
    256: '256 GB holds the system and some apps. It does not hold a family photo vault or a movie library.',
    1000: '1 TB holds the system, a pile of games, or a starter photo library. Phone photos fit for a while. Years of 4K video do not.',
    4000: '4 TB is a real photo library or a small movie shelf. One disk can die. A backup is a second copy. One disk is not a backup.',
    8000: '8 TB is a family movie library or a big camera archive. Put the system on a fast SSD. Put the pile on a hard drive.',
    16000: '16 TB or more is media-server size. Use more than one disk. A mirror protects you from one disk dying. It does not protect you from fire, theft, or a mistaken delete.'
  };

  var BUDGET_TEXT = {
    have: 'You already own the computer. This build uses the parts you named. It does not sneak in a graphics card or a pile of memory you do not have.',
    200: 'Under $200 is a used small office PC, or the computer you already own. It can be a tiny server. It is not a new gaming PC and it will not run big AI models.',
    500: '$200 to $500 can buy a used office PC with 16 to 32 GB, or a mini PC. That is a good closet server. A strong graphics card is luck, not the plan.',
    1200: '$500 to $1,200 can be a starter lab with about 32 GB and a used graphics card, or a nice daily PC. Games plus a full server usually means this money buys one strong role, not both at full strength.',
    more: 'More than $1,200 can be two machines. That is the calm plan: one daily computer, and one closet server.'
  };

  var JOB_LABELS = {
    games: 'Games',
    photos: 'Photos',
    video: 'Video',
    movies: 'Movies and TV',
    smart: 'Smart home',
    ai: 'Local AI',
    learn: 'Learning',
    files: 'Files and backups'
  };

  function jobList(a) {
    if (!a || a.job == null || a.job === '') return [];
    return Array.isArray(a.job) ? a.job.slice() : [a.job];
  }

  function hasJob(a, id) {
    return jobList(a).indexOf(id) !== -1;
  }

  function flavorChoices(a) {
    var out = [];
    function add(id) {
      var item = FLAVORS[id];
      out.push({ value: id, label: item.name, detail: item.plain });
    }
    if (a.side === 'win') {
      add('win');
      add('winpro');
      return out;
    }
    if (a.side === 'mac') {
      if (a.role === 'server') {
        add('macmini');
        return out;
      }
      add('mac');
      if (a.role === 'both' || a.skill === 'lab') add('maclab');
      if (a.role === 'everyday' && a.skill !== 'lab') add('macmini');
      return out;
    }
    if (a.role !== 'server' && hasJob(a, 'games')) add('bazzite');
    if (a.role !== 'server') add('mint');
    if (a.role !== 'server' && a.skill === 'ok' && !hasJob(a, 'games')) add('omarchy');
    if (a.role !== 'everyday') {
      add('ubuntu');
      if (Number(a.ram) >= 32) add('proxmox');
      var jobs = jobList(a);
      var onlySmallJobs = jobs.length > 0 && jobs.every(function (id) { return id === 'smart' || id === 'learn'; });
      if (Number(a.ram) <= 8 && a.skill === 'ok' && onlySmallJobs) add('alpine');
    }
    if (!out.length) add('mint');
    return out;
  }

  function explain(answers) {
    var a = answers || {};
    var choices = flavorChoices(a);
    var allowed = {};
    choices.forEach(function (choice) { allowed[choice.value] = true; });
    var pick = allowed[a.flavor] ? a.flavor : choices[0].value;
    var profile = FLAVORS[pick];
    var mac = a.side === 'mac' && pick !== 'maclab';
    var gpu = GPU_TEXT[a.gpu] || GPU_TEXT.none;
    var ramLine = (a.side === 'mac' ? MAC_RAM_TEXT : RAM_TEXT)[Number(a.ram)] || RAM_TEXT[16];
    var storage = STORAGE_TEXT[Number(a.storage)] || STORAGE_TEXT[256];
    if ((hasJob(a, 'movies') || hasJob(a, 'files') || hasJob(a, 'photos')) && Number(a.storage) >= 4000 && a.role !== 'everyday' && pick !== 'mac') {
      storage += ' If the pile is the real job, TrueNAS can be the shelf. It is free. Unraid does a similar job and costs money. The shelf keeps disks. It is not your game desk.';
    }
    var labLine = '';
    if (pick === 'maclab') {
      labLine = Number(a.ram) >= 32
        ? 'The lab box in this build is Proxmox, because 32 GB or more was on the table. The Mac stays macOS.'
        : 'The lab box in this build is Ubuntu Server or Debian. Step up to Proxmox only after that box has 32 GB.';
    }
    var pickedJobs = jobList(a).map(function (id) { return JOB_LABELS[id] || id; });
    return {
      pick: pick,
      choices: choices,
      jobs: pickedJobs,
      plan: buildPlan(a, pick),
      because: profile.why,
      profile: profile,
      labLine: labLine,
      hardware: {
        ram: ramLine,
        gpuLabel: mac ? 'Unified memory, shared with the graphics' : gpu.label,
        games: mac
          ? 'Mac games exist. Some big PC games have no Mac version, and anti-cheat games often do not show up here.'
          : gpu.games,
        photos: mac
          ? 'Photos and Lightroom fit a Mac well. ' + (gpu.photos ? '' : '') + 'Heavy jobs still need free unified memory, because the graphics borrow it.'
          : gpu.photos,
        video: mac
          ? 'Final Cut and DaVinci are the video path. AI video that expects an NVIDIA card does not move onto a Mac. Short experiments exist. A movie pipeline does not.'
          : gpu.video,
        models: mac
          ? macModels(Number(a.ram))
          : gpu.models,
        storage: storage,
        budget: BUDGET_TEXT[a.budget] || BUDGET_TEXT.have
      },
      others: choices.filter(function (choice) { return choice.value !== pick; }).map(function (choice) {
        return { name: FLAVORS[choice.value].name, plain: FLAVORS[choice.value].plain };
      })
    };
  }

  function gpuGb(a) {
    if (!a || a.side === 'mac' || a.gpu === 'none' || a.gpu == null || a.gpu === '') return 0;
    var n = Number(a.gpu);
    return n > 0 ? n : 0;
  }

  function buildPlan(a, pick) {
    var ram = Number(a.ram) || 16;
    var card = gpuGb(a);
    var disk = Number(a.storage) || 0;
    var server = pick === 'proxmox' || pick === 'ubuntu' || pick === 'alpine' || pick === 'macmini';
    var desk = pick === 'win' || pick === 'winpro' || pick === 'mint' || pick === 'bazzite' || pick === 'omarchy' || pick === 'mac';
    var now = [];
    var later = [];
    function add(list, name, detail) { list.push(name + '. ' + detail); }
    function ollamaReady() {
      if (a.side === 'mac' || pick === 'mac' || pick === 'macmini') return ram >= 16;
      if (card >= 6) return true;
      return ram >= 32 && card === 0;
    }

    var use = '';
    var setup = [];
    if (pick === 'win' || pick === 'winpro') {
      use = 'Use Windows 11. Download it from Microsoft. When the installer asks for a product key, choose I don’t have a product key. Windows runs without activation. A small watermark can sit on the screen, and some wallpaper settings stay locked until you buy a real key from Microsoft. You do not need a borrowed key.';
      setup = [
        'Use Microsoft’s own Windows 11 installer.',
        'On the product-key screen, choose I don’t have a product key.',
        'Finish Windows Update before you add Steam or house apps.',
        'Put games and photos on a second disk when you have one. Leave the first disk for Windows.'
      ];
      if (pick === 'winpro') {
        setup.push('Pro adds BitLocker, Remote Desktop, and Hyper-V. Write the BitLocker recovery key on paper before you turn BitLocker on. Use Remote Desktop only inside the house.');
      }
    } else if (pick === 'bazzite') {
      use = 'Use Bazzite. It is a Linux game desk with Steam already in the plan. Download the Desktop image. Pick the NVIDIA download only if your card is NVIDIA. AMD and Intel graphics use the other image.';
      setup = [
        'Copy your files off the target disk first.',
        'Write the Bazzite image to a USB and install it.',
        'Open Steam after the first boot and sign in.',
        'Keep movies, backups, and Home Assistant on a second computer if you have one. This one is the game desk.'
      ];
    } else if (pick === 'mint') {
      use = hasJob(a, 'games')
        ? 'You can install Linux Mint Cinnamon for a familiar desk. If games are the main job, use Bazzite instead. Bazzite already includes the game setup. Mint is the better doll when you want to learn the normal Linux desk.'
        : 'Use Linux Mint Cinnamon. Download it from the Linux Mint site. It is the friendly desk, with a menu and a taskbar.';
      setup = [
        'Write Mint to a USB. Keep your old files on another disk until the new desk is open.',
        'Add programs from the Software Manager first.',
        'Add one extra tool. Use it for a week before you add another.'
      ];
    } else if (pick === 'omarchy') {
      use = 'Use Omarchy only if you already fix Linux problems. It is a keyboard desk, not a game machine and not a closet server.';
      setup = [
        'Read the install notes before you erase a disk.',
        'Keep a second computer nearby for the first week.',
        'Do not put the only copy of family photos here.'
      ];
    } else if (pick === 'proxmox') {
      use = 'Use Proxmox VE. It is free for a home. You drive it from a web page in the house. Each job gets its own small computer, called a guest. The host is Proxmox itself, and it must keep some memory.';
      setup = ram >= 64
        ? [
          'Install Proxmox VE on its own SSD. Leave the big disks for files and movies.',
          'Leave 8 GB of memory for the Proxmox host. Do not give that 8 GB to guests.',
          'Start with the guests that match your jobs. A movie guest gets 4 GB. A smart-home guest gets 4 GB. A files guest gets 4 GB.',
          'Give the graphics card to one guest only, and only if that guest runs AI. The other guests use the processor.',
          'Open the Proxmox web page only from inside the house. Add one guest, prove it opens, then add the next.'
        ]
        : [
          'Install Proxmox VE on its own SSD. Leave the big disks for files and movies.',
          'Leave 4 GB of memory for the Proxmox host.',
          'Start with two guests. Give each one 4 GB. A 32 GB machine cannot hold a crowd.',
          'Give the graphics card to one guest only, and only if that guest runs AI.',
          'Open the Proxmox web page only from inside the house.'
        ];
    } else if (pick === 'ubuntu') {
      use = 'Use Ubuntu Server LTS. LTS means this edition stays supported for years. Install Docker, then add house apps one at a time. Most homelab instructions assume Ubuntu, so you will not fight the guide.';
      setup = [
        'Install Ubuntu Server LTS and turn on SSH so you can control it from another computer.',
        'Install Docker Engine using Docker’s Ubuntu instructions.',
        'Add one app. Open it from another computer in the house. Then add the next.',
        'Keep the admin pages off the public internet.',
        'Put Ubuntu on an SSD. Put movies and photos on a bigger disk.'
      ];
    } else if (pick === 'alpine') {
      use = 'Use Alpine for one job only. It is small on purpose. A second app means this was the wrong system. Ubuntu Server is the stack doll.';
      setup = [
        'Write the one job on paper before you install.',
        'Keep another computer you can type from.',
        'Do not add a pile of Docker apps here. Many of them assume Ubuntu.'
      ];
    } else if (pick === 'mac' || pick === 'macmini') {
      use = pick === 'mac'
        ? 'Stay on macOS. Do not erase the Mac to build a server. Add one house helper only after normal Mac life feels calm.'
        : 'Use the Mac mini as the always-on helper. Leave macOS on the internal drive. Plug the big file disk in beside it.';
      setup = [
        'Turn on Time Machine to a disk that is not the only copy of your photos.',
        'Turn on Remote Login for yourself. Do not open it to the public internet.',
        'Add one app. Leave it alone for a week before you add another.'
      ];
    } else if (pick === 'maclab') {
      use = ram >= 32
        ? 'Keep the Mac on macOS. The second computer should be Proxmox, because 32 GB or more was on the table. Edit on the Mac. Run the house on the lab box.'
        : 'Keep the Mac on macOS. The second computer should be Ubuntu Server until it has 32 GB. Then it can become Proxmox. Edit on the Mac. Run the house on the lab box.';
      setup = [
        'Do not erase the Mac.',
        'Install the lab system on the other computer.',
        'Point Time Machine at a disk on the lab box, and keep another copy of photos somewhere else.'
      ];
    }

    if (hasJob(a, 'games')) {
      if (pick === 'bazzite' || pick === 'win' || pick === 'winpro' || pick === 'mac') {
        add(now, 'Steam', pick === 'mac'
          ? 'Install Steam from the Mac App Store or the Steam site. Some big PC games have no Mac version.'
          : 'Install Steam and play here. New anti-cheat games are most at home on Windows.');
      } else if (pick === 'mint') {
        add(now, 'Steam', 'Mint can run many Steam games. If the game library is the real job, switch this desk to Bazzite.');
      } else {
        add(later, 'A game desk', 'This computer should not be the game machine. Play on Windows, or on a Linux desk called Bazzite. Leave this box for the house.');
      }
    }

    if (hasJob(a, 'movies') || (server && disk >= 4000)) {
      var movieWhere = server || pick === 'maclab' || pick === 'macmini' ? now : later;
      if (hasJob(a, 'movies') && desk && pick !== 'bazzite') movieWhere = now;
      if (pick === 'bazzite') movieWhere = later;
      add(movieWhere, 'Jellyfin or Plex', card > 0 && card <= 2
        ? 'Either one can serve movies to the TVs in the house. A 1 or 2 GB card often cannot convert video for a phone. Play the original file, or let the TV do that work. Start with one of these apps, not both.'
        : 'Either one can serve movies and TV to the house. Jellyfin is free. Plex is the other famous choice and has paid extras. Start with one, not both. The computer that runs it has to stay on.');
    } else if (server || pick === 'maclab') {
      add(later, 'Jellyfin or Plex', 'When the movie pile shows up, one of these becomes the house player. Jellyfin is free. Plex is the paid-extras choice. A few terabytes of disk makes this real.');
    }

    if (hasJob(a, 'photos')) {
      if (pick === 'win' || pick === 'winpro' || pick === 'mac' || pick === 'maclab') {
        add(now, 'Photos or Lightroom', 'Edit on the desk you sit at. Keep the library on a second disk.');
      } else if (pick === 'mint' || pick === 'bazzite' || pick === 'omarchy') {
        add(now, 'digiKam or Darktable', 'These are the free photo desks. Edit here. Store the pile on a second disk.');
      }
      if (server || pick === 'macmini' || pick === 'maclab' || disk >= 4000) {
        add(disk >= 1000 ? now : later, 'Immich', 'Immich is a private photo library for the whole house, like a photo cloud you own. It wants a big disk and a computer that stays on.');
      }
    } else if (server && disk >= 4000) {
      add(later, 'Immich', 'Immich can hold the family photo library in the house when you are ready. It is not a public cloud.');
    }

    if (hasJob(a, 'video') && (desk || pick === 'maclab' || pick === 'win' || pick === 'winpro')) {
      add(now, pick === 'mac' || pick === 'maclab' ? 'Final Cut or DaVinci' : 'DaVinci Resolve or Kdenlive', 'Edit on the desk. Let a server store the footage if you add one later. Do not edit the movie inside Proxmox.');
    }

    if (hasJob(a, 'smart') || server || pick === 'maclab') {
      var smartList = hasJob(a, 'smart') && pick !== 'alpine' ? now : (hasJob(a, 'smart') ? now : later);
      if (pick === 'bazzite' || ((pick === 'win' || pick === 'mint' || pick === 'omarchy' || pick === 'mac') && a.role === 'everyday')) {
        smartList = later;
      }
      add(smartList, 'Home Assistant', pick === 'alpine'
        ? 'This can be the one Alpine job. It runs lights, sensors, and switches. Do not add a second app beside it.'
        : (pick === 'proxmox' || pick === 'maclab'
          ? 'Home Assistant runs the lights and sensors. Give it a 4 GB guest of its own. Keep its page inside the house.'
          : 'Home Assistant runs the lights and sensors. Install it with Docker. Keep its page inside the house.'));
    }

    if (hasJob(a, 'ai') || card >= 6 || ((a.side === 'mac' || pick === 'mac' || pick === 'macmini') && ram >= 16)) {
      var aiNow = hasJob(a, 'ai') && ollamaReady() && pick !== 'alpine';
      var aiDetail = 'Ollama is how a house runs its own chat model. This card or this amount of memory is too small for a useful one. The install waits for a bigger card, or for 32 GB and a lot of patience.';
      if (ollamaReady() && card >= 6 && pick === 'proxmox') {
        aiDetail = 'Ollama runs a chat model here. Put it in the one guest that owns the graphics card. Run one model at a time.';
      } else if (ollamaReady() && card >= 6) {
        aiDetail = 'Ollama runs a chat model on the graphics card. Run one model at a time, and close heavy games or a video export first.';
      } else if (ollamaReady() && (a.side === 'mac' || pick === 'mac' || pick === 'macmini')) {
        aiDetail = 'Ollama runs a chat model in the Mac’s unified memory. Close big apps first. Run one model at a time.';
      } else if (ollamaReady()) {
        aiDetail = 'Ollama can run a small model on the processor. It will be slow. This is practice, not a daily assistant.';
      }
      add(aiNow ? now : later, 'Ollama', aiDetail);
    }

    if (hasJob(a, 'files') || (server && disk >= 4000) || pick === 'maclab') {
      add(hasJob(a, 'files') || disk >= 4000 ? now : later, 'A shared folder', pick === 'proxmox'
        ? 'Give one guest the big disks and share a folder with the rest of the house. TrueNAS can be that guest when the pile is huge. A shared folder is not a backup. Keep a second copy somewhere else.'
        : 'Share one folder with the other computers in the house. Samba does this on Linux. A Mac can share a folder too. One disk is still not a backup.');
    }

    if (hasJob(a, 'learn') && !now.length) {
      add(now, 'One practice app', 'Learn this system with a single app. A web page you can open from another computer is enough for week one.');
    }

    if (pick === 'alpine' && now.length > 1) {
      later = now.slice(1).concat(later);
      now = [now[0]];
      later.unshift('One job only. Alpine stays small. Move the rest of this list to Ubuntu Server when you want more than one app.');
    }

    return { use: use, setup: setup, now: now, later: later };
  }

  function macModels(ram) {
    var base = 'On a Mac, local models use the same unified memory as your apps. They do not use CUDA, which is the NVIDIA tool most PC AI guides assume. ';
    if (ram <= 8) return base + 'At 8 GB, skip local models or try only a tiny one with every other app closed.';
    if (ram <= 16) return base + 'At 16 GB, a small 7-billion-parameter chat model can run in a 4-bit copy if the Mac is otherwise quiet.';
    if (ram <= 24) return base + 'At 24 GB, mid-size chat models are fair. Do not export a long video at the same time.';
    if (ram <= 32) return base + 'At 32 GB, local chat is a real tool. Picture models exist. NVIDIA-style AI video still wants a PC card.';
    return base + 'At ' + ram + ' GB, larger chat models fit. This is still not a 24 GB NVIDIA card, and a 70-billion model is not the daily plan.';
  }

  var STEPS = [
    {
      id: 'side',
      title: 'Choose your side',
      hint: 'Start with the family you want. The next screens open only that family. Windows, Linux, and Mac are the three sides.',
      choices: [
        { value: 'win', label: 'Windows', detail: 'The normal PC. Games, stores, and the buttons most people know.' },
        { value: 'linux', label: 'Linux', detail: 'Free systems. A friendly desk, a closet server, or a boss of many little computers.' },
        { value: 'mac', label: 'Mac', detail: 'The Apple desk. Quiet, finished, and a different kind of memory.' }
      ]
    },
    {
      id: 'role',
      titleFor: function (a) {
        if (a.side === 'mac') return 'Where does the Mac live?';
        if (a.side === 'win') return 'Where does this Windows PC live?';
        return 'Where does this Linux computer live?';
      },
      hint: 'One computer. Say if you sit at it, if it hides in a closet, or if it tries to do both.',
      choices: [
        { value: 'everyday', label: 'I sit at it', detail: 'Web, school, files, maybe games.' },
        { value: 'server', label: 'It stays on for the house', detail: 'A closet box or a Mac mini. I use another screen to control it.' },
        { value: 'both', label: 'One computer does both', detail: 'I sit at it, and it also runs the house.' }
      ]
    },
    {
      id: 'job',
      multi: true,
      title: 'What jobs matter most?',
      hint: 'Tap every job you care about. Games can sit next to photos, video, or a house server. Then press continue.',
      choices: [
        { value: 'games', label: 'Games', detail: 'Play on this computer. New games, or a smaller library.' },
        { value: 'photos', label: 'Photos', detail: 'Sort, edit, and keep pictures.' },
        { value: 'video', label: 'Video', detail: 'Edit movies, or try AI video.' },
        { value: 'movies', label: 'Movies and TV', detail: 'A library the house can watch.' },
        { value: 'smart', label: 'Smart home', detail: 'Lights, sensors, and voice in the house.' },
        { value: 'ai', label: 'Local AI', detail: 'Chat models that stay in the house.' },
        { value: 'learn', label: 'Learning', detail: 'I want to learn this side for real.' },
        { value: 'files', label: 'Files and backups', detail: 'A safe place for documents and copies.' }
      ]
    },
    {
      id: 'skill',
      titleFor: function (a) {
        if (a.side === 'win') return 'How hands-on do you want Windows to be?';
        if (a.side === 'mac') return 'How far do you want to take the Mac?';
        return 'How well do you know Linux?';
      },
      hintFor: function (a) {
        if (a.side === 'linux') return 'Linux is the family Mint, Ubuntu, Alpine, and Proxmox belong to.';
        if (a.side === 'mac') return 'You can stay in the normal Mac, or add a lab beside it.';
        return 'Home is the simple layer. Pro adds locks, remote desktop, and a practice virtual computer.';
      },
      choicesFor: function (a) {
        if (a.side === 'win') {
          return [
            { value: 'simple', label: 'Just make it work', detail: 'I want the normal Windows desk.' },
            { value: 'steps', label: 'I can follow careful steps', detail: 'I will turn on a few extra tools if they are worth it.' },
            { value: 'switches', label: 'I like the extra switches', detail: 'Remote desktop, disk locks, and a practice virtual computer sound good.' }
          ];
        }
        if (a.side === 'mac') {
          return [
            { value: 'simple', label: 'Keep the Mac simple', detail: 'Photos, video, and normal Mac life.' },
            { value: 'terminal', label: 'I can use Terminal a little', detail: 'I will install a helper app if the steps are clear.' },
            { value: 'lab', label: 'I want a lab next to the Mac', detail: 'The Mac stays. Another computer can run the house.' }
          ];
        }
        return [
          { value: 'new', label: 'Linux is new to me', detail: 'I have not really used it.' },
          { value: 'some', label: 'I have tried it', detail: 'I can click around. The terminal still feels shaky.' },
          { value: 'ok', label: 'I can fix a problem', detail: 'A bad update would annoy me, not stop me.' }
        ];
      }
    },
    {
      id: 'games',
      when: function (a) { return hasJob(a, 'games'); },
      titleFor: function (a) {
        return a.side === 'mac' ? 'What kind of games on this Mac?' : 'What kind of games on this computer?';
      },
      hint: 'Anti-cheat means the game checks that you are not cheating. Many of those games only trust Windows.',
      choices: [
        { value: 'aaa', label: 'New games', detail: 'Including online games that use anti-cheat.' },
        { value: 'some', label: 'Some games', detail: 'Older games, indie games, or a store library is enough.' }
      ]
    },
    {
      id: 'ram',
      titleFor: function (a) {
        return a.side === 'mac' ? 'How much unified memory does the Mac have?' : 'How much memory (RAM) can it have?';
      },
      hintFor: function (a) {
        if (a.side === 'mac') return 'On a Mac, this number is also the graphics memory. The screen and the AI share it. It is not a separate NVIDIA card.';
        return 'RAM is the desk space while you work. It is not the closet where files live.';
      },
      choicesFor: function (a) {
        if (a.side === 'mac') {
          return [
            { value: 8, label: '8 GB', detail: 'Tight. Browsing and writing. Local AI will feel sticky.' },
            { value: 16, label: '16 GB', detail: 'A calm daily Mac. One small model if the Mac is quiet.' },
            { value: 24, label: '24 GB', detail: 'More air for video and mid-size models.' },
            { value: 32, label: '32 GB', detail: 'A strong Mac for Final Cut and local chat.' },
            { value: 64, label: '64 GB', detail: 'A serious Apple-silicon workstation.' },
            { value: 128, label: '128 GB or more', detail: 'A top Mac. Still not an NVIDIA video card.' }
          ];
        }
        return [
          { value: 8, label: '8 GB', detail: 'One job at a time.' },
          { value: 16, label: '16 GB', detail: 'A normal daily computer, or a starter server.' },
          { value: 32, label: '32 GB', detail: 'The start of a real lab.' },
          { value: 64, label: '64 GB', detail: 'A comfortable lab.' },
          { value: 128, label: '128 GB or more', detail: 'A big lab.' }
        ];
      }
    },
    {
      id: 'gpu',
      when: function (a) { return a.side !== 'mac'; },
      title: 'What graphics card do you have?',
      hint: 'The GPU draws games and can run AI. The GB here is the card’s own memory, not the computer’s RAM. A Mac does not get this question, because its graphics share system memory.',
      choices: [
        { value: 'none', label: 'No extra card', detail: 'Only the graphics built into the processor.' },
        { value: 1, label: '1 GB or less', detail: 'A very old card. It shows the desktop. It is not for new games or AI.' },
        { value: 2, label: 'About 2 GB', detail: 'An old card. Old games at low settings. Not a chat-model card.' },
        { value: 4, label: 'About 3 or 4 GB', detail: 'A common older card. Light 1080p games. Still small for AI.' },
        { value: 6, label: 'About 6 GB', detail: 'A card like a 2060. 1080p games and a small chat model.' },
        { value: 8, label: 'About 8 GB', detail: 'A common recent card.' },
        { value: 12, label: 'About 12 GB', detail: 'Room for bigger models and 4K video.' },
        { value: 16, label: 'About 16 GB', detail: 'Strong for 1440p and mid-size models.' },
        { value: 24, label: '24 GB or more', detail: 'Games, pictures, and short AI video.' }
      ]
    },
    {
      id: 'storage',
      title: 'How much storage will hold your files?',
      hint: 'Count the big disks, not only the small drive the system boots from.',
      choices: [
        { value: 256, label: '256 GB', detail: 'System and apps. Not a photo vault.' },
        { value: 1000, label: '1 TB', detail: 'Games or a starter photo library.' },
        { value: 4000, label: 'About 4 TB', detail: 'A real photo pile or a small movie shelf.' },
        { value: 8000, label: 'About 8 TB', detail: 'Family movies or a big camera archive.' },
        { value: 16000, label: '16 TB or more', detail: 'Media-server size. Plan more than one disk.' }
      ]
    },
    {
      id: 'budget',
      title: 'What can you spend if you had to buy the box?',
      hint: 'If you already own it, say so.',
      choices: [
        { value: 'have', label: 'I already own it', detail: 'I am only picking the system.' },
        { value: 200, label: 'Under $200', detail: 'Used tiny office PC money.' },
        { value: 500, label: '$200 to $500', detail: 'A used server or a mini PC.' },
        { value: 1200, label: '$500 to $1,200', detail: 'A starter lab or a nice daily PC.' },
        { value: 'more', label: 'More than $1,200', detail: 'Enough to think about two computers.' }
      ]
    },
    {
      id: 'flavor',
      title: 'Open the last layer',
      hint: 'These are the real builds inside the side you chose. The other sides stay closed. Tap the one that should be yours.',
      choicesFor: function (a) { return flavorChoices(a); }
    }
  ];

  function stepsFor(answers) {
    var a = answers || {};
    return STEPS.filter(function (step) {
      return !step.when || step.when(a);
    });
  }

  function field(step, answers, name) {
    var fn = step[name + 'For'];
    if (typeof fn === 'function') return fn(answers);
    return step[name];
  }

  function mount(rootEl) {
    var answers = {};
    var index = 0;

    function el(tag, className, text) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    }

    function draw() {
      rootEl.innerHTML = '';
      var steps = stepsFor(answers);
      if (index >= steps.length) return drawResult();
      var step = steps[index];
      var choices = field(step, answers, 'choices') || [];
      rootEl.appendChild(el('p', 'wiz-progress', 'Layer ' + (index + 1) + ' of ' + steps.length));
      rootEl.appendChild(el('h2', 'wiz-title', field(step, answers, 'title')));
      rootEl.appendChild(el('p', 'wiz-hint', field(step, answers, 'hint') || ''));
      var list = el('div', 'wiz-choices');
      var picked = Array.isArray(answers[step.id]) ? answers[step.id] : [];
      choices.forEach(function (choice) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'wiz-choice' + (step.multi ? ' wiz-multi' : '');
        button.setAttribute('aria-pressed', 'false');
        var on = step.multi
          ? picked.indexOf(choice.value) !== -1
          : String(answers[step.id]) === String(choice.value);
        if (on) {
          button.classList.add('is-on');
          button.setAttribute('aria-pressed', 'true');
        }
        button.appendChild(el('strong', '', (on && step.multi ? 'Yes · ' : '') + choice.label));
        button.appendChild(el('span', '', choice.detail));
        button.addEventListener('click', function () {
          if (step.multi) {
            var current = Array.isArray(answers[step.id]) ? answers[step.id].slice() : [];
            var at = current.indexOf(choice.value);
            if (at === -1) current.push(choice.value);
            else current.splice(at, 1);
            answers[step.id] = current;
            if (current.indexOf('games') === -1) delete answers.games;
            draw();
            return;
          }
          answers[step.id] = choice.value;
          index += 1;
          draw();
        });
        list.appendChild(button);
      });
      rootEl.appendChild(list);
      if (step.multi) {
        var keep = document.createElement('button');
        keep.type = 'button';
        keep.className = 'btn btn-primary wiz-next';
        keep.textContent = 'Continue';
        keep.disabled = picked.length === 0;
        keep.addEventListener('click', function () {
          if (!Array.isArray(answers[step.id]) || !answers[step.id].length) return;
          index += 1;
          draw();
        });
        rootEl.appendChild(keep);
      }
      if (index > 0) {
        var back = document.createElement('button');
        back.type = 'button';
        back.className = 'btn btn-ghost wiz-back';
        back.textContent = 'Back';
        back.addEventListener('click', function () {
          index -= 1;
          draw();
        });
        rootEl.appendChild(back);
      }
    }

    function drawResult() {
      var report = explain(answers);
      var profile = report.profile;
      var hw = report.hardware;
      rootEl.appendChild(el('p', 'wiz-progress', 'Your build'));
      rootEl.appendChild(el('h2', 'wiz-title', profile.build));
      rootEl.appendChild(el('p', 'wiz-hint', profile.name + '. ' + profile.plain));
      if (report.jobs.length) {
        rootEl.appendChild(section('The jobs you picked', ['This build is for ' + report.jobs.join(', ') + '.']));
      }
      rootEl.appendChild(section('Why this is the one', [report.because, report.labLine]));
      rootEl.appendChild(section('Use this', [report.plan.use]));
      rootEl.appendChild(listSection('Set it up', report.plan.setup));
      if (report.plan.now.length) {
        rootEl.appendChild(listSection('What you can run', report.plan.now));
      }
      if (report.plan.later.length) {
        rootEl.appendChild(listSection('What it can grow into', report.plan.later));
      }
      rootEl.appendChild(listSection('What this build is good at', profile.good));
      rootEl.appendChild(listSection('What this build should not pretend to be', profile.poor));
      rootEl.appendChild(section('Memory', [hw.ram]));
      rootEl.appendChild(section('Graphics', [hw.gpuLabel + '. ' + hw.games]));
      rootEl.appendChild(section('Photos', [hw.photos]));
      rootEl.appendChild(section('Video', [hw.video]));
      rootEl.appendChild(section('AI models', [hw.models]));
      rootEl.appendChild(section('Storage', [hw.storage]));
      rootEl.appendChild(section('Money', [hw.budget]));
      rootEl.appendChild(listSection('Do this first', profile.first));
      rootEl.appendChild(section('The next doll', [profile.next]));
      if (report.others.length) {
        rootEl.appendChild(listSection('The other builds inside your side', report.others.map(function (item) {
          return item.name + ' — ' + item.plain;
        })));
      }
      var again = document.createElement('button');
      again.type = 'button';
      again.className = 'btn btn-primary wiz-back';
      again.textContent = 'Start over';
      again.addEventListener('click', function () {
        answers = {};
        index = 0;
        draw();
      });
      rootEl.appendChild(again);
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'btn btn-ghost wiz-back';
      back.textContent = 'Change the last layer';
      back.addEventListener('click', function () {
        index = Math.max(0, stepsFor(answers).length - 1);
        draw();
      });
      rootEl.appendChild(back);
    }

    function section(title, paragraphs) {
      var box = el('section', 'wiz-block');
      box.appendChild(el('h3', '', title));
      paragraphs.forEach(function (text) {
        if (text) box.appendChild(el('p', '', text));
      });
      return box;
    }

    function listSection(title, items) {
      var box = el('section', 'wiz-block');
      box.appendChild(el('h3', '', title));
      var ul = document.createElement('ul');
      items.forEach(function (item) {
        ul.appendChild(el('li', '', item));
      });
      box.appendChild(ul);
      return box;
    }

    draw();
  }

  return {
    FLAVORS: FLAVORS,
    stepsFor: stepsFor,
    flavorChoices: flavorChoices,
    explain: explain,
    mount: mount
  };
});
