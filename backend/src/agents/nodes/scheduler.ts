import { AgentState } from '../state';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const schedulerNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { taskData, userId } = state;
  const now = new Date();

  let deadlineTimeForFilter = 0;

  // STRICT DEADLINE OVERRIDE & DUPLICATION CHECK
  if (taskData?.existingCardNumber && userId) {
    try {
      const existingTask = await (prisma as any).task.findFirst({
        where: { cardNumber: taskData.existingCardNumber, userId },
        include: { scheduleBlocks: true }
      });
      
      // Prevent duplicate schedule deployments
      if (existingTask && existingTask.scheduleBlocks && existingTask.scheduleBlocks.length > 0) {
        return {
          finalResponse: "I have detected that emergency timeblocks were already deployed for this task previously. To prevent overlap, no new blocks were generated.",
          scheduleData: [],
          nextNode: 'END'
        };
      }

      if (existingTask && existingTask.deadline) {
        deadlineTimeForFilter = existingTask.deadline.getTime();
      }
    } catch (e) {
      console.error("Failed to fetch exact deadline from DB in scheduler:", e);
    }
  }

  if (deadlineTimeForFilter === 0) {
    if (taskData?.deadline) {
      deadlineTimeForFilter = new Date(taskData.deadline).getTime();
    } else {
      const artificialDeadline = new Date(now);
      artificialDeadline.setHours(23, 30, 0, 0);
      deadlineTimeForFilter = artificialDeadline.getTime();
    }
  }

  // If the deadline is in the past (breached), return a breach flag block instead of attempting to schedule
  if (deadlineTimeForFilter < now.getTime()) {
    return {
      finalResponse: "This task has already breached its deadline. A timeline failure record has been permanently logged in your Autonomous Block Planner.",
      scheduleData: [{
        startTime: new Date(deadlineTimeForFilter).toISOString(),
        endTime: new Date(deadlineTimeForFilter).toISOString(),
        reason: "CRITICAL: DEADLINE BREACHED"
      }],
      nextNode: 'END'
    };
  }

  // We strictly use the deterministic algorithmic timeline generator for ALL tasks.
  // The user strictly prefers immediate continuous block generation up to the deadline.
  const filteredData: any[] = [];
  const blockDurationMs = 30 * 60 * 1000; // 30 minute chunks
  
  let remainingTime = deadlineTimeForFilter - now.getTime();
  let currentTimeMs = now.getTime() + (5 * 60 * 1000); // Start in 5 mins
  
  while (remainingTime > 0 && currentTimeMs < deadlineTimeForFilter) {
     let chunkDuration = Math.min(blockDurationMs, remainingTime);
     let blockEndMs = currentTimeMs + chunkDuration;
     if (blockEndMs > deadlineTimeForFilter) {
        blockEndMs = deadlineTimeForFilter;
        chunkDuration = blockEndMs - currentTimeMs;
     }
     
     if (chunkDuration < 5 * 60 * 1000) break; // too small, abort loop

     const getTimeBasedReason = (timeMs: number) => {
        const hours = new Date(timeMs).getHours();
        
        // Map exact hours to specific unique reasons
        switch (hours) {
          // Morning (6-11 AM)
          case 6: return "Early 6 AM alignment scheduled to leverage peak morning cognitive momentum.";
          case 7: return "Strategic 7 AM execution block assigned for uninterrupted priority focus.";
          case 8: return "Core 8 AM timeline secured to aggressively mitigate deadline failure.";
          case 9: return "Active 9 AM structural block deployed for maximum morning efficiency.";
          case 10: return "Late morning 10 AM sequence initiated to wrap up early execution goals.";
          
          // Mid-Day (11 AM - 1 PM)
          case 11: return "Pre-lunch 11 AM execution block deployed to maintain continuous progress.";
          case 12: return "Mid-day 12 PM alignment scheduled to aggressively drive task completion.";
          
          // Afternoon (1 PM - 4 PM)
          case 13: return "Post-lunch 1 PM timeline optimized to bridge morning and afternoon workloads.";
          case 14: return "High-priority 2 PM execution block assigned to the deep-work afternoon slot.";
          case 15: return "Mid-afternoon 3 PM sequence initiated to ensure steady progression.";
          
          // Evening (4 PM - 7 PM)
          case 16: return "Late afternoon 4 PM structural timeline reserved to transition into evening.";
          case 17: return "Evening 5 PM buffer activated to aggressively close the remaining workload.";
          case 18: return "Snack phase 6 PM locked in for uninterrupted evening execution.";
          
          // Night (7 PM - 11 PM)
          case 19: return "Night 7 PM alignment scheduled to finalize pending deliverables.";
          case 20: return "Night 8 PM structural block reserved for critical task completion.";
          case 21: return "Late-night 9 PM emergency execution block deployed to strictly prevent failure.";
          case 22: return "Nocturnal 10 PM sequence initiated for absolute critical recovery.";
          
          // Late Night (11 PM - 6 AM)
          default: return "Extreme late-night block allocated to guarantee strict timeline adherence.";
        }
     };

     filteredData.push({
       startTime: new Date(currentTimeMs).toISOString(),
       endTime: new Date(blockEndMs).toISOString(),
       reason: getTimeBasedReason(currentTimeMs)
     });
     
     currentTimeMs = blockEndMs + (5 * 60 * 1000); // 5 min break between blocks
     remainingTime -= chunkDuration;
  }

  return {
    scheduleData: filteredData,
    nextNode: 'supervisor' // Send to supervisor for final response
  };
};
