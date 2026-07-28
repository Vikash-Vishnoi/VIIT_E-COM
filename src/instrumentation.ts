export async function register() {
  // We only want the cron job to run on the Node.js server, not the edge runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamic import to avoid edge-runtime conflicts
    const cron = await import('node-cron');
    const { connectDB } = await import('@/lib/db');
    const { default: Product } = await import('@/models/Product');

    // Run every day at 3:00 AM (Server local time)
    // "0 3 * * *" = 3:00 AM every day
    cron.schedule('0 3 * * *', async () => {
      console.log('Running daily feed algorithm recalculation...');
      try {
        await connectDB();
        
        // Use an atomic pipeline update to recalculate the score for all active products
        // without pulling any data into Node's RAM.
        await Product.updateMany(
          { 'colors.isActive': true },
          [
            {
              $set: {
                colors: {
                  $map: {
                    input: '$colors',
                    as: 'c',
                    in: {
                      $mergeObjects: [
                        '$$c',
                        {
                          popularityScore: {
                            $round: [
                              {
                                $add: [
                                  // 1. Featured boost: +100
                                  { $cond: ['$$c.isFeatured', 100, 0] },
                                  
                                  // 2. Badge boost
                                  {
                                    $switch: {
                                      branches: [
                                        { case: { $eq: ['$$c.badge', 'Best Seller'] }, then: 50 },
                                        { case: { $eq: ['$$c.badge', 'New'] },         then: 40 },
                                        { case: { $eq: ['$$c.badge', 'Limited'] },     then: 35 },
                                        { case: { $eq: ['$$c.badge', 'Sale'] },        then: 30 },
                                      ],
                                      default: 0,
                                    },
                                  },
                                  
                                  // 3. Rating score (max +25)
                                  {
                                    $multiply: [
                                      { $divide: [{ $ifNull: ['$$c.ratings.average', 0] }, 5] },
                                      25,
                                      { $min: [{ $divide: [{ $ifNull: ['$$c.ratings.count', 0] }, 30] }, 1] },
                                    ],
                                  },
                                  
                                  // 4. Recency decay (max +35 on day 0, decays to 0 at day 35)
                                  {
                                    $max: [
                                      0,
                                      {
                                        $subtract: [
                                          35,
                                          {
                                            $divide: [
                                              { $subtract: [new Date(), '$createdAt'] },
                                              86400000, // ms per day
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                              1, // round to 1 decimal place
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          ]
        );
        console.log('Daily feed algorithm updated successfully.');
      } catch (error) {
        console.error('Failed to update daily feed algorithm:', error);
      }
    });
    
    console.log('Cron Job Registered: Daily Feed Algorithm Recalculation');
  }
}
