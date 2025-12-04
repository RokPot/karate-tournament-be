# Profile Pipeline Multi-Instance Support

## Overview

The profile pipeline system is designed to handle intensive processing tasks for user profiles, including AI analysis, salary calculations, and economic assessments. To ensure reliability and scalability, the system must support multiple instances running simultaneously without conflicts or race conditions.

## The Multi-Instance Challenge

### Problems with Multiple Instances

When running multiple instances of the application, several critical issues can occur:

1. **Race Conditions**: Multiple workers can process the same profile simultaneously
2. **Duplicate Processing**: Expensive AI operations running multiple times for the same profile
3. **Database Conflicts**: Concurrent updates to the same profile causing inconsistent state
4. **Resource Waste**: Unnecessary computation and API calls

### Example Scenario

```
Instance A: Starts processing profile "abc-123"
Instance B: Also picks up a job for profile "abc-123" 
Result: Both instances run expensive AI analysis simultaneously
```

## Solution: PG-Boss SingletonKey

### How It Works

PG-Boss provides a `singletonKey` feature that ensures only one job with a specific key can run at a time **across all instances**. This is perfect for ensuring per-profile job exclusivity.

### Implementation

#### 1. Updated PG-Boss Provider

The PG-Boss provider now supports `singletonKey` through `providerOptions`:

```typescript
// src/common/queues/providers/pg-boss/pg-boss-queue.provider.ts
if (job.providerOptions?.singletonKey) {
  options.singletonKey = job.providerOptions.singletonKey;
}
```

#### 2. Profile Pipeline Processor

All profile-related jobs now use singleton keys:

```typescript
// Helper method for consistent singleton key generation
private getProfileSingletonOptions(profileId: string) {
  return {
    providerOptions: { singletonKey: `profile:${profileId}` }
  };
}

// Usage in job enqueuing
await this.queueService.enqueue(
  START_WORTH_CALCULATION, 
  { profileId: profile.id }, 
  this.getProfileSingletonOptions(profile.id)
);
```

#### 3. Singleton Key Pattern

All profile jobs use the pattern: `profile:{profileId}`

This ensures that:
- Only one job per profile can run at a time
- Jobs for different profiles can run in parallel
- Works across multiple instances automatically

### Queue Configuration

The profile pipeline queue is configured with singleton policy:

```typescript
export const PROFILE_PIPELINE_QUEUE_CONFIG = {
  name: 'profile-pipeline',
  policy: 'singleton',
  retryLimit: 3,
  retryDelay: 5,
  retryBackoff: true,
  expireInSeconds: 1800, // 30 minutes
};
```

## Benefits

### 1. **Guaranteed Exclusivity**
- Only one worker processes each profile at any time
- Prevents duplicate expensive operations (AI analysis, salary calculations)
- Eliminates race conditions

### 2. **Cross-Instance Coordination**
- Works automatically across multiple instances
- No additional coordination mechanism needed
- Database-level locking ensures consistency

### 3. **Parallel Processing**
- Different profiles can still be processed in parallel
- Optimal resource utilization
- Scalable across instances

### 4. **Fault Tolerance**
- If an instance crashes, another can pick up the job
- Built-in retry mechanism
- Job timeout prevents stuck jobs

## Performance Considerations

### Throughput
- Multiple profiles can be processed simultaneously
- Only same-profile jobs are serialized
- Horizontal scaling still effective

### Resource Usage
- Eliminates duplicate AI API calls
- Reduces database contention
- More predictable resource consumption

### Monitoring
- Each job has a unique singleton key for tracking
- Easy to identify processing bottlenecks
- Clear job status visibility

## Usage Guidelines

### 1. **Always Use Singleton Keys for Profile Jobs**

```typescript
// ✅ Good - uses singleton key
await this.queueService.enqueue(
  'profile-job', 
  { profileId }, 
  { providerOptions: { singletonKey: `profile:${profileId}` } }
);

// ❌ Bad - no singleton key (race condition risk)
await this.queueService.enqueue('profile-job', { profileId });
```

### 2. **Consistent Key Patterns**

Use the established pattern for all profile-related jobs:
- Format: `profile:{profileId}`
- Consistent across all services
- Use the helper method when available

### 3. **Job Timeout Configuration**

Set appropriate timeouts for profile jobs:
- AI analysis: 30 minutes
- Database operations: 5 minutes
- External API calls: 10 minutes

## Testing Multi-Instance Scenarios

### Local Testing

1. Start multiple instances with different ports:
```bash
# Terminal 1
npm run start:dev

# Terminal 2
PORT=3001 npm run start:dev
```

2. Submit profile jobs to both instances
3. Verify only one processes each profile

### Load Testing

1. Create multiple profiles
2. Submit jobs simultaneously
3. Monitor job processing order
4. Verify no duplicate processing

## Troubleshooting

### Common Issues

1. **Jobs Not Processing**
   - Check if previous job is stuck
   - Verify singleton key format
   - Monitor job timeouts

2. **Performance Issues**
   - Monitor singleton key distribution
   - Check for hot profiles
   - Review job timeout settings

3. **Database Conflicts**
   - Ensure all profile jobs use singleton keys
   - Check for missing singleton key configurations
   - Verify job ordering

### Monitoring

Key metrics to monitor:
- Job queue length per singleton key
- Job processing time per profile
- Failed job count and reasons
- Instance distribution of jobs

## Migration Notes

When upgrading existing deployments:

1. **Deploy Code First**: Update all instances with singleton key support
2. **Clear Existing Jobs**: Optional - clear pending jobs to avoid conflicts
3. **Monitor Initial Run**: Watch for any race conditions
4. **Gradual Rollout**: Start with single instance, then scale up

## Related Files

- `src/common/queues/providers/pg-boss/pg-boss-queue.provider.ts` - PG-Boss provider with singleton support
- `src/modules/pipelines/profile/profile-pipeline.queue-processor.ts` - Main profile pipeline processor
- `src/modules/pipelines/profile/profile-pipeline.constant.ts` - Queue configuration
- `src/modules/profile/profile-rest.service.ts` - Profile REST service
- `src/modules/persona/persona.service.ts` - Persona service 