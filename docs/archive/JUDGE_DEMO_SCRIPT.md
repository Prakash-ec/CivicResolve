# CIVICRESOLVE — 3-MINUTE JUDGE DEMO SCRIPT

## Setup Before Presenting
- Browser tab open at: `http://localhost:5173/`
- Terminal running server (`npm --prefix server start`) and frontend (`npm --prefix frontend run dev`).

---

## Word-For-Word Demo Script

### [0:00 - 0:45] Introduction & Visual Identity
> *"Hello judges! We are proud to present **CivicResolve: Your City. Your Voice. Your Resolve.**
>
> Notice the visual identity right away: crafted in Deep Municipal Navy and Saffron Orange, inspired by official public service platforms like CivicLens. In the top bar, citizens have instant access to 5 regional languages—English, Tamil, Hindi, Telugu, and Kannada—as well as screen reader access and rem font scaling.
>
> Let's sign in to test the platform. On our unified login page, we provide 1-click **Autofill Demo** buttons so evaluators can test immediately without typing."*
>
> *(Click "Autofill Citizen Demo" &rarr; Click "Sign In as Citizen")*

### [0:45 - 1:45] Citizen Grievance Filing with Multimodal AI & Voice
> *"Here in the Citizen Dashboard, I can see my active issues and ResolveRewards balance. Let's file a new grievance.
>
> Notice the top priority banner indicating my phone status. I'll enter a title: 'Dangerous crater on arterial road'.
>
> Now, instead of typing a long description, watch this:*
>
> *(Click "Voice Dictation" &rarr; Speak: "Large road cavity near bus stand creating severe traffic bottleneck" &rarr; Text appears live)*
>
> *"Our Web Speech integration supports English, Tamil, and Hindi. I can also click 'AI Assist' to structure this with municipal context.
>
> When I pick my location on the map, CivicResolve actively checks for nearby duplicates within 120 meters. If a neighbor already reported it, an alert appears offering to confirm their report instead of creating clutter.
>
> I attach my photo evidence and submit. Instantly, our concurrency-safe generator creates public reference ID CR-2026-XXXXXX, and Google Gemini performs multimodal triage to assign the department and priority."*

### [1:45 - 2:30] Phone OTP Verification & Community Co-Resolution
> *"Let's visit My Profile. Here, citizens link their Indian mobile number via Firebase SMS OTP. Using Firebase `linkWithCredential`, we preserve the citizen's existing UID—never duplicating accounts. Using our whitelisted test number 9999999999 and code 123456, we verify instantly with zero SMS quota spent.
>
> Next, let's open the **Community Issues Hub**. Here, citizens discover active issues nearby. When I see an existing issue and click **'Yes, This Issue Exists'**, my verification is locked in, the grievance priority escalates, and I receive 10 ResolveRewards credits."*

### [2:30 - 3:00] Municipal Command & Civic Impact Intelligence
> *"Finally, let's switch to the Municipal Administrator perspective.
>
> Under the **Civic Intelligence Center**, city engineers don't just see dots on a map. Our Haversine algorithm clusters grievances within 150 meters into Hotspots, computing a deterministic **Civic Impact Score from 0 to 100** based on hazard level, density, community confirmations, and overdue age.
>
> The system automatically synthesizes explainable engineering directives: for example, recommending continuous asphalt milling instead of temporary patches, with a 1-click button to dispatch field crews.
>
> In the **Photo Evidence Console**, Gemini Multimodal AI forensically verifies uploaded images, assessing authenticity scores and checking for tampering before elevating priority.
>
> With 100% of our 52 automated tests passing and zero-cost Spark tier deployment, CivicResolve is ready for real municipal deployment today. Thank you!"*
